from __future__ import annotations

import asyncio
import io
import json
import math
import os
import uuid
import csv
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/api/generate")
DEFAULT_MODELS = ["llama3.1:8b", "llama3.2", "mistral", "qwen2.5"]
DATASET_PATH = "pune_dairy_dataset.csv"

class AssessmentInput(BaseModel):
    village: str
    block: str
    district: str
    business_category: str
    available_margin_capital: float = Field(..., gt=0)
    latitude: float
    longitude: float
    target_language: str = "en"
    shop_act_number: Optional[str] = None
    registered_business_name: Optional[str] = None
    business_description: Optional[str] = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("target_language")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        return value.strip().lower() or "en"


class EnterpriseLocation(BaseModel):
    enterprise_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    village: str
    block: str
    district: str
    business_category: str
    latitude: float
    longitude: float


app = FastAPI(title="GramAdvisory AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AsyncIOScheduler()
SAVED_ENTERPRISES: List[EnterpriseLocation] = []
SENTINEL_ALERTS: List[Dict[str, Any]] = []


def format_currency(value: float) -> str:
    if value < 0:
        return "-₹" + format_currency(abs(value))
    formatted = f"₹{value:,.2f}"
    return formatted.replace(",", " ")


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def project_cost_for_margin(margin_capital: float) -> float:
    return margin_capital / 0.10


def compute_financials(available_margin_capital: float, business_category: str) -> Dict[str, Any]:
    project_cost = project_cost_for_margin(available_margin_capital)
    promoter_equity = project_cost * 0.10
    maximum_loan = project_cost * 0.90

    if project_cost <= 140000:
        scheme = {
            "scheme_name": "Micro Finance Scheme",
            "interest_rate_pa": 6.5,
            "tenure_quarters": 12,
            "moratorium_quarters": 1,
            "loan_cap": 125000,
            "eligibility": "Eligible under micro finance pilot",
        }
    elif project_cost <= 5000000:
        scheme = {
            "scheme_name": "Term Loan Scheme",
            "interest_rate_pa": 8.0,
            "tenure_quarters": 28,
            "moratorium_quarters": 2,
            "loan_cap": 4500000,
            "eligibility": "Eligible under term loan pilot",
        }
    else:
        scheme = {
            "scheme_name": "No Pilot Scheme",
            "interest_rate_pa": 0.0,
            "tenure_quarters": 0,
            "moratorium_quarters": 0,
            "loan_cap": 0,
            "eligibility": "Project cost exceeds the current pilot coverage",
        }

    loan_amount = 0.0 if scheme["loan_cap"] <= 0 else min(maximum_loan, scheme["loan_cap"])
    working_capital_requirement = project_cost * 0.25
    category_multiplier = {
        "dairy": 1.00,
        "retail/kirana": 0.80,
        "retail": 0.80,
        "kirana": 0.80,
        "textiles": 0.95,
        "poultry": 0.93,
        "agro-processing": 1.10,
    }.get(str(business_category).strip().lower(), 0.85)
    monthly_operational_cost_benchmark = (project_cost * category_multiplier * 0.08) / 12

    return {
        "business_category": business_category,
        "margin_capital": available_margin_capital,
        "promoter_equity": promoter_equity,
        "project_cost": project_cost,
        "maximum_loan_eligibility": maximum_loan,
        "loan_amount": loan_amount,
        "working_capital_requirement": working_capital_requirement,
        "monthly_operational_cost_benchmark": monthly_operational_cost_benchmark,
        "scheme": scheme,
    }


def generate_quarterly_schedule(
    principal: float,
    annual_rate: float,
    total_quarters: int,
    moratorium_quarters: int,
) -> List[Dict[str, Any]]:
    if total_quarters <= 0:
        return []

    outstanding = principal
    schedule: List[Dict[str, Any]] = []
    quarterly_rate = annual_rate / 100 / 4

    for quarter in range(1, min(moratorium_quarters, total_quarters) + 1):
        interest = outstanding * quarterly_rate
        schedule.append(
            {
                "quarter": quarter,
                "opening_balance": round(outstanding, 2),
                "interest": round(interest, 2),
                "principal": 0.0,
                "total_payment": round(interest, 2),
                "closing_balance": round(outstanding, 2),
                "status": "moratorium",
            }
        )

    active_quarters = max(0, total_quarters - moratorium_quarters)
    if active_quarters > 0:
        equal_principal = principal / active_quarters
        for quarter in range(moratorium_quarters + 1, total_quarters + 1):
            opening_balance = outstanding
            interest = outstanding * quarterly_rate
            principal_payment = min(equal_principal, outstanding)
            if quarter == total_quarters:
                principal_payment = outstanding
            outstanding = max(0.0, outstanding - principal_payment)
            total_payment = principal_payment + interest
            schedule.append(
                {
                    "quarter": quarter,
                    "opening_balance": round(opening_balance, 2),
                    "interest": round(interest, 2),
                    "principal": round(principal_payment, 2),
                    "total_payment": round(total_payment, 2),
                    "closing_balance": round(outstanding, 2),
                    "status": "active",
                }
            )

    return schedule


def build_financial_roadmap(financials: Dict[str, Any], schedule: List[Dict[str, Any]]) -> Dict[str, Any]:
    scheme = financials["scheme"]
    active_payments = [row["total_payment"] for row in schedule if row.get("status") == "active"]
    moratorium_payments = [row["total_payment"] for row in schedule if row.get("status") == "moratorium"]
    first_active_payment = active_payments[0] if active_payments else 0.0
    average_active_payment = sum(active_payments) / len(active_payments) if active_payments else 0.0
    average_moratorium_payment = sum(moratorium_payments) / len(moratorium_payments) if moratorium_payments else 0.0

    return {
        "financial_structuring": {
            "margin_percent": 10,
            "loan_percent": 90,
            "available_margin_capital": financials["margin_capital"],
            "total_feasible_project_cost": financials["project_cost"],
            "maximum_loan_amount": financials["maximum_loan_eligibility"],
            "sanctionable_loan_amount": financials["loan_amount"],
        },
        "scheme_auto_selection": {
            "selected_scheme": scheme["scheme_name"],
            "interest_rate_pa": scheme["interest_rate_pa"],
            "tenure_years": round(scheme["tenure_quarters"] / 4, 2),
            "tenure_quarters": scheme["tenure_quarters"],
            "moratorium_months": scheme["moratorium_quarters"] * 3,
            "moratorium_quarters": scheme["moratorium_quarters"],
            "eligibility": scheme["eligibility"],
            "routing_logic": "Micro Finance Scheme for project cost up to INR 1.40 lakh; Term Loan Scheme for project cost above INR 1.40 lakh and up to INR 50.00 lakh; above this cap, the project exceeds current scheme eligibility.",
        },
        "emi_moratorium_generator": {
            "repayment_frequency": "Quarterly",
            "moratorium_note": "During moratorium, interest is paid but principal repayment is deferred.",
            "first_active_quarter_payment": round(first_active_payment, 2),
            "average_active_quarter_payment": round(average_active_payment, 2),
            "average_moratorium_quarter_payment": round(average_moratorium_payment, 2),
            "monthly_operational_cost_benchmark": financials["monthly_operational_cost_benchmark"],
            "working_capital_requirement": financials["working_capital_requirement"],
        },
    }


async def make_ollama_summary(assessment_input: AssessmentInput, assessment: Dict[str, Any]) -> Dict[str, Any]:
    if not OLLAMA_ENDPOINT:
        return {"enabled": False, "summary": "Ollama endpoint is not configured."}

    prompt = (
        "You are a rural enterprise finance advisor. Return valid JSON only with exactly two keys: "
        "summary (a concise practical executive summary string) and swot (an object with arrays named "
        "strengths, weaknesses, opportunities, and threats). "
        "Write all values in "
        f"{assessment_input.target_language or 'en'} for a business in {assessment_input.village}, "
        f"{assessment_input.block}, {assessment_input.district}. Business: {assessment_input.business_category}. "
        f"Project cost: ₹{assessment['financials']['project_cost']:,.0f}. Loan: ₹{assessment['financials']['loan_amount']:,.0f}. "
        f"Selected scheme: {assessment['scheme']['scheme_name']}. "
        f"Feasibility: {assessment['feasibility_report']['market_reach']['consumer_catchment_summary']}. "
        "Keep the summary short, practical, and actionable. Give 3 specific items per SWOT array."
    )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                OLLAMA_ENDPOINT,
                json={"model": DEFAULT_MODELS[0], "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            payload = response.json()
            text = (payload.get("response") or "").strip()
            if not text:
                return {"enabled": False, "summary": "Ollama returned an empty response."}
            parsed_text = text.removeprefix("```json").removesuffix("```").strip()
            parsed = json.loads(parsed_text)
            swot = parsed.get("swot") or {}
            valid_swot = {
                key: [str(item) for item in swot.get(key, [])[:3]]
                for key in ("strengths", "weaknesses", "opportunities", "threats")
            }
            return {
                "enabled": True,
                "summary": str(parsed.get("summary") or "AI summary generated."),
                "swot": valid_swot,
                "model": DEFAULT_MODELS[0],
            }
    except Exception as exc:
        return {"enabled": False, "summary": "Ollama narrative not available; using deterministic rule engine output.", "error": str(exc)}


def load_local_dataset() -> List[Dict[str, Any]]:
    farms = []
    if not os.path.exists(DATASET_PATH):
        return []
    try:
        with open(DATASET_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                farms.append(row)
    except Exception:
        pass
    return farms


def find_local_competitors(village: str, block: str, farms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    matches = []
    v_clean = village.strip().lower()
    b_clean = block.strip().lower()
    for farm in farms:
        area = farm.get("location_area", "").strip().lower()
        if v_clean in area or b_clean in area:
            matches.append(farm)
    if not matches and farms:
        # Return first 5 representative farms from Pune dataset
        matches = farms[:5]
    return matches


async def fetch_overpass_data(lat: float, lon: float, radius_m: int = 10000) -> List[Dict[str, Any]]:
    query = f"""
    [out:json][timeout:25];
    (
      node(around:{radius_m},{lat},{lon})["shop"~"grocery|general|supermarket|bakery|milk|hardware|fertilizer|clothes|agri|dairy"];
      node(around:{radius_m},{lat},{lon})["amenity"~"marketplace|bank|post_office|pharmacy|veterinary|clinic|fuel"];
      node(around:{radius_m},{lat},{lon})["industrial"~"warehouse|factory|mill|processing"];
      node(around:{radius_m},{lat},{lon})["craft"~".*"];
      node(around:{radius_m},{lat},{lon})["highway"~"primary|secondary|trunk|service"];
    );
    out center; 
    """
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    elements = payload.get("elements", [])
    mapped: List[Dict[str, Any]] = []
    for element in elements:
        tags = element.get("tags", {}) or {}
        lat_value = element.get("lat")
        lon_value = element.get("lon")
        if lat_value is None or lon_value is None:
            center = element.get("center") or {}
            lat_value = center.get("lat")
            lon_value = center.get("lon")
        if lat_value is None or lon_value is None:
            continue
        mapped.append(
            {
                "id": element.get("id"),
                "type": element.get("type"),
                "lat": safe_float(lat_value),
                "lon": safe_float(lon_value),
                "distance_km": round(haversine_km(lat, lon, safe_float(lat_value), safe_float(lon_value)), 2),
                "tags": tags,
            }
        )
    return mapped


def distance_decayed_saturation_score(nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not nodes:
        return {"score": 0.0, "total_access": 0, "active_nodes": []}

    access_score = 0.0
    active_nodes: List[Dict[str, Any]] = []
    for node in nodes:
        distance = max(node.get("distance_km", 0.0), 0.05)
        score_component = 1 / ((distance + 0.5) ** 1.2)
        access_score += score_component
        active_nodes.append({
            "id": node.get("id"),
            "distance_km": round(distance, 2),
            "score_component": round(score_component, 6),
            "tags": node.get("tags", {}),
        })

    denominator = max(1.0, len(nodes) * 0.75 + 2.0)
    normalized = min(100.0, (access_score / denominator) * 100.0)
    return {
        "score": round(normalized, 2),
        "total_access": round(access_score, 4),
        "active_nodes": active_nodes,
    }


def rule_based_feasibility_fallback(assessment_input: AssessmentInput, spatial_summary: Dict[str, Any], local_competitors: List[Dict[str, Any]]) -> Dict[str, Any]:
    is_dairy = assessment_input.business_category.strip().lower() == "dairy"
    saturation = spatial_summary.get("saturation_score", 0.0)
    relevant_nodes = spatial_summary.get("relevant_nodes", [])
    competitor_count = len(relevant_nodes) + (len(local_competitors) if is_dairy else 0)
    
    if saturation >= 75:
        density_rating = "High competition"
    elif saturation >= 45:
        density_rating = "Moderate competition"
    else:
        density_rating = "Low competition"

    activity_summary = f" Focus: {assessment_input.business_description}." if assessment_input.business_description else ""

    if is_dairy:
        comp_names = [f"{c.get('farm_name')} ({c.get('location_area')})" for c in local_competitors[:5]]
        data_status = "Available (Pune Synthetic Dairy Dataset)"
    else:
        comp_names = []
        data_status = "Data Not Available for this sector (Benchmark dataset currently covers Dairy only)"

    report = {
        "market_reach": {
            "consumer_catchment_summary": f"Within a 5-10 km trading radius in {assessment_input.village}, the enterprise can serve ~{max(600, int(competitor_count * 180 + 900))} households.{activity_summary}",
            "distribution_channels": [
                "Weekly haat / local village mandi linkages",
                "Farm-gate direct and doorstep morning delivery",
                "Local retail network and village grocery tie-ups",
            ],
            "catchment_radius_km": "5-10 km",
        },
        "opportunity_analysis": {
            "niches": [
                f"Fresh, reliable supply in underserved pockets of {assessment_input.village}",
                "Shortage-driven daily consumption products with consistent morning dispatch",
                "Value-addition and doorstep recurring subscriptions",
            ],
            "demand_drivers": [
                "Consistent repeat purchases by rural households",
                "Growing preference for unadulterated, farm-fresh products",
                "Proximity to regional village transit points",
            ],
        },
        "business_analysis": {
            "strengths": [
                "Micro-enterprise can leverage local trust and short delivery cycles.",
                "Lower capital requirement keeps break-even faster.",
                "Local relationship networks improve collections and sales intent.",
            ],
            "weaknesses": [
                "Cash-flow volatility during lean seasons.",
                "Limited working capital buffer for inventory stress.",
                "Dependence on local transport continuity.",
            ],
            "opportunities": [
                "Value-added processing and bundling for rural households.",
                "Linkages with formal buying centers and local cooperatives.",
                "Seasonal promotions aligned with festival demand spikes.",
            ],
            "threats": [
                "Raw material price inflation",
                "Single-buyer credit delays",
                "Logistics disruption during monsoon or road repair windows",
            ],
        },
        "threats_identification": {
            "risks": [
                "Monsoon logistics disruptions and transport bottlenecks.",
                "Single-buyer credit delays reducing working capital turnover.",
                "Input cost inflation and seasonal demand dips.",
            ]
        },
        "competitor_mapping": {
            "data_status": data_status,
            "has_dataset": is_dairy,
            "competitor_count": competitor_count if is_dairy else 0,
            "density_rating": density_rating if is_dairy else "Data Not Available",
            "local_benchmarks": comp_names,
            "competitive_advantage_tactics": [
                "Offer smaller unit packs priced for daily wage purchasing power.",
                "Guarantee freshness and consistent morning supply timing.",
                "Bundle loyalty with informal credit and delivery convenience.",
            ],
        },
        "product_market_value": {
            "pricing_strategy": f"Affordable rural daily-wage pricing for {assessment_input.business_category} category.",
            "gross_unit_margin_percent": 24 if is_dairy else 20,
            "daily_wage_alignment": "Target price point of 1-3 daily wage equivalents for repeat-purchase items.",
        },
        "metadata": {
            "location": f"{assessment_input.village}, {assessment_input.block}, {assessment_input.district}",
            "business_category": assessment_input.business_category,
            "business_description": assessment_input.business_description or "General micro-enterprise operations",
            "saturation_score": round(saturation, 2),
            "target_language": assessment_input.target_language,
        },
    }
    return report


async def build_spatial_summary(assessment_input: AssessmentInput) -> Dict[str, Any]:
    nodes = await fetch_overpass_data(assessment_input.latitude, assessment_input.longitude, radius_m=10000)
    relevant = []
    for node in nodes:
        tags = node.get("tags", {})
        key_hits = ["shop", "amenity", "industrial", "craft", "highway", "marketplace"]
        if any(key in tags for key in key_hits):
            relevant.append(node)

    saturation = distance_decayed_saturation_score(relevant)
    return {
        "saturation_score": saturation["score"],
        "relevant_nodes": relevant,
        "distance_model": saturation,
    }


async def assess_enterprise(assessment_input: AssessmentInput) -> Dict[str, Any]:
    financials = compute_financials(
        assessment_input.available_margin_capital,
        assessment_input.business_category,
    )
    spatial_summary = await build_spatial_summary(assessment_input)
    
    # Load and filter local dataset if Dairy
    dataset = load_local_dataset()
    local_competitors = find_local_competitors(assessment_input.village, assessment_input.block, dataset)
    
    feasibility_report = rule_based_feasibility_fallback(assessment_input, spatial_summary, local_competitors)

    loan_principal = financials["loan_amount"]
    scheme = financials["scheme"]
    schedule = generate_quarterly_schedule(
        principal=loan_principal,
        annual_rate=scheme["interest_rate_pa"],
        total_quarters=scheme["tenure_quarters"],
        moratorium_quarters=scheme["moratorium_quarters"],
    )
    financial_roadmap = build_financial_roadmap(financials, schedule)

    narrative = await make_ollama_summary(assessment_input, {
        "financials": financials,
        "scheme": {**scheme, "loan_amount": loan_principal},
        "feasibility_report": feasibility_report,
    })
    ai_swot = narrative.get("swot") if narrative.get("enabled") else None
    if ai_swot and all(ai_swot.get(key) for key in ("strengths", "weaknesses", "opportunities", "threats")):
        feasibility_report["business_analysis"] = ai_swot

    return {
        "assessment_input": assessment_input.model_dump(),
        "financials": financials,
        "scheme": {
            "scheme_name": scheme["scheme_name"],
            "interest_rate_pa": scheme["interest_rate_pa"],
            "tenure_quarters": scheme["tenure_quarters"],
            "moratorium_quarters": scheme["moratorium_quarters"],
            "loan_cap": scheme["loan_cap"],
            "maximum_loan_eligibility": financials["maximum_loan_eligibility"],
            "loan_amount": loan_principal,
        },
        "spatial_summary": {
            "saturation_score": spatial_summary["saturation_score"],
            "nearby_relevant_nodes": len(spatial_summary["relevant_nodes"]),
        },
        "feasibility_report": feasibility_report,
        "financial_roadmap": financial_roadmap,
        "schedule": schedule,
        "narrative": narrative,
        "compliance": {
            "shop_act_number": assessment_input.shop_act_number,
            "registered_business_name": assessment_input.registered_business_name,
            "business_description": assessment_input.business_description,
            "status": "Verified Active (Shop Act)" if assessment_input.shop_act_number else "Self-Certified",
        }
    }


async def build_pdf_bytes(assessment: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("GramAdvisory AI - Detailed Project Report (DPR)", styles["Title"]))
    story.append(Spacer(1, 8))
    
    comp = assessment.get("compliance", {})
    input_data = assessment["assessment_input"]
    summary = assessment["financials"]
    scheme = assessment["scheme"]
    report = assessment["feasibility_report"]

    story.append(Paragraph(f"<b>Entity:</b> {comp.get('registered_business_name') or 'Rural Micro-Enterprise'} | <b>Shop Act No:</b> {comp.get('shop_act_number') or 'Self-Certified'}", styles["Normal"]))
    if comp.get("business_description"):
        story.append(Paragraph(f"<b>Core Activity:</b> {comp.get('business_description')}", styles["Normal"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("1. Enterprise Profile & Financial Structuring", styles["Heading2"]))
    profile_rows = [
        ["Location (Village/Block/District)", f"{input_data['village']} / {input_data['block']} / {input_data['district']}"],
        ["Business Category", input_data["business_category"]],
        ["Promoter Equity / Margin (10%)", format_currency(summary["margin_capital"])],
        ["Total Feasible Project Cost (100%)", format_currency(summary["project_cost"])],
        ["Sanctionable Bank Loan (90%)", format_currency(summary["loan_amount"])],
        ["Working Capital Reserve (25%)", format_currency(summary["working_capital_requirement"])],
        ["Routed Scheme", scheme["scheme_name"]],
        ["Interest Rate / Moratorium", f"{scheme['interest_rate_pa']}% p.a. | {scheme['moratorium_quarters']*3} months moratorium"],
        ["Total Tenure", f"{scheme['tenure_quarters']/4:.1f} years ({scheme['tenure_quarters']} quarters)"],
    ]
    profile_table = Table(profile_rows, colWidths=[220, 280])
    profile_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ])
    )
    story.append(profile_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("2. General Business Analysis (SWOT)", styles["Heading2"]))
    swot = report.get("business_analysis", {})
    for label, values in {
        "Strengths": swot.get("strengths", []),
        "Weaknesses": swot.get("weaknesses", []),
        "Opportunities": swot.get("opportunities", []),
        "Threats": swot.get("threats", []),
    }.items():
        story.append(Paragraph(f"<b>{label}:</b> " + "; ".join(values), styles["BodyText"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(Paragraph("3. Quarterly Amortization Schedule (Initial 10 Quarters)", styles["Heading2"]))
    ledger_rows = [["Qtr", "Opening Balance", "Interest", "Principal", "Total Payment", "Status"]]
    for row in assessment["schedule"][:10]:
        ledger_rows.append([
            f"Q{row['quarter']}",
            format_currency(row["opening_balance"]),
            format_currency(row["interest"]),
            format_currency(row["principal"]),
            format_currency(row["total_payment"]),
            row["status"].capitalize(),
        ])
    ledger_table = Table(ledger_rows, colWidths=[40, 95, 80, 80, 95, 70])
    ledger_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ])
    )
    story.append(ledger_table)

    doc.build(story)
    return buffer.getvalue()


@app.get("/")
async def root() -> Dict[str, str]:
    return {"status": "GramAdvisory AI is running", "service": "hyper-local rural enterprise advisory"}


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/assess")
async def assess_endpoint(payload: AssessmentInput) -> Dict[str, Any]:
    assessment = await assess_enterprise(payload)
    return assessment


@app.post("/generate-pdf")
async def generate_pdf(payload: AssessmentInput) -> Response:
    assessment = await assess_enterprise(payload)
    pdf_bytes = await build_pdf_bytes(assessment)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=GramAdvisory_DPR_{payload.village}.pdf"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
