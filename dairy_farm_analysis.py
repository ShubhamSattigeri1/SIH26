import csv
import json
from collections import Counter
from pathlib import Path

DATA_FILE = Path(r"C:\Users\Admin\Downloads\pune_50_synthetic_dairy_farms.csv")
OUTPUT_FILE = Path(__file__).with_name("dairy_farm_analysis.json")


def to_float(value):
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return 0.0


def to_int(value):
    try:
        return int(float(str(value).replace(",", "").strip()))
    except (TypeError, ValueError):
        return 0


with DATA_FILE.open("r", encoding="utf-8", newline="") as csv_file:
    rows = list(csv.DictReader(csv_file))

if not rows:
    raise SystemExit(f"No data found in {DATA_FILE}")

farm_count = len(rows)
active_count = sum(1 for row in rows if str(row.get("status", "")).strip().lower() == "active")
seasonal_count = sum(1 for row in rows if str(row.get("status", "")).strip().lower() == "seasonal")

total_cattle = sum(to_int(row.get("cattle_count")) for row in rows)
total_buffalo = sum(to_int(row.get("buffalo_count")) for row in rows)
total_animals = sum(to_int(row.get("total_animals")) for row in rows)

avg_daily_milk = sum(to_float(row.get("estimated_daily_milk_litres")) for row in rows) / farm_count
monthly_milk_output = sum(to_float(row.get("monthly_milk_output_litres")) for row in rows)
monthly_revenue = sum(to_float(row.get("estimated_monthly_revenue_inr")) for row in rows)
avg_monthly_revenue = monthly_revenue / farm_count
avg_farm_size = sum(to_float(row.get("farm_size_acres")) for row in rows) / farm_count
avg_employees = sum(to_int(row.get("employees")) for row in rows) / farm_count

farm_type_distribution = Counter(str(row.get("farm_type", "")).strip() for row in rows)
status_distribution = Counter(str(row.get("status", "")).strip() for row in rows)
location_distribution = Counter(str(row.get("location_area", "")).strip() for row in rows)
breed_distribution = Counter(str(row.get("main_breed", "")).strip() for row in rows)
product_distribution = Counter(str(row.get("products", "")).strip() for row in rows)

top_farms_by_revenue = sorted(
    rows,
    key=lambda row: to_float(row.get("estimated_monthly_revenue_inr")),
    reverse=True,
)[:5]

top_farms_by_milk = sorted(
    rows,
    key=lambda row: to_float(row.get("estimated_daily_milk_litres")),
    reverse=True,
)[:5]

analysis = {
    "dataset_summary": {
        "total_farms": farm_count,
        "active_farms": active_count,
        "seasonal_farms": seasonal_count,
        "total_cattle": total_cattle,
        "total_buffalo": total_buffalo,
        "total_animals": total_animals,
        "average_daily_milk_litres_per_farm": round(avg_daily_milk, 2),
        "total_monthly_milk_output_litres": round(monthly_milk_output, 2),
        "total_monthly_revenue_inr": round(monthly_revenue, 2),
        "average_monthly_revenue_inr_per_farm": round(avg_monthly_revenue, 2),
        "average_farm_size_acres": round(avg_farm_size, 2),
        "average_employees_per_farm": round(avg_employees, 2),
    },
    "farm_type_distribution": dict(farm_type_distribution.most_common()),
    "status_distribution": dict(status_distribution.most_common()),
    "location_area_distribution": dict(location_distribution.most_common(10)),
    "main_breed_distribution": dict(breed_distribution.most_common()),
    "products_distribution": dict(product_distribution.most_common()),
    "top_farms_by_revenue": [
        {
            "farm_id": row["farm_id"],
            "farm_name": row["farm_name"],
            "location_area": row["location_area"],
            "monthly_revenue_inr": to_float(row.get("estimated_monthly_revenue_inr")),
            "monthly_milk_output_litres": to_float(row.get("monthly_milk_output_litres")),
            "total_animals": to_int(row.get("total_animals")),
        }
        for row in top_farms_by_revenue
    ],
    "top_farms_by_daily_milk": [
        {
            "farm_id": row["farm_id"],
            "farm_name": row["farm_name"],
            "location_area": row["location_area"],
            "estimated_daily_milk_litres": to_float(row.get("estimated_daily_milk_litres")),
            "monthly_milk_output_litres": to_float(row.get("monthly_milk_output_litres")),
            "main_breed": row["main_breed"],
        }
        for row in top_farms_by_milk
    ],
    "market_insights": {
        "dominant_business_model": farm_type_distribution.most_common(1)[0][0],
        "top_breed": breed_distribution.most_common(1)[0][0],
        "most_common_area": location_distribution.most_common(1)[0][0],
        "average_milk_per_animal_daily_litres": round(avg_daily_milk / (total_animals / farm_count) if total_animals else 0, 2),
        "average_revenue_per_animal_inr": round(monthly_revenue / total_animals if total_animals else 0, 2),
    },
}

OUTPUT_FILE.write_text(json.dumps(analysis, indent=2), encoding="utf-8")

print(json.dumps({
    "summary": analysis["dataset_summary"],
    "dominant_business_model": analysis["market_insights"]["dominant_business_model"],
    "top_breed": analysis["market_insights"]["top_breed"],
    "total_monthly_revenue_inr": analysis["dataset_summary"]["total_monthly_revenue_inr"],
}, indent=2))
