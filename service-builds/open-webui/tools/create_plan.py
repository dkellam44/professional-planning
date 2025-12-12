"""
title: Create Plan
author: Claude Code
version: 0.1.0
"""

import requests
from typing import Optional

class Tools:
    def __init__(self):
        self.valves = {
            "PLANNER_API_URL": "http://planner-api:8091/api/v1",
            "TIMEOUT": 30
        }

    def create_plan(self, intent: str, engagement_id: Optional[int] = None) -> dict:
        """
        Create a new plan based on user intent.

        Calls the Planner API to generate a structured plan with SOP (Standard Operating Procedure).

        Args:
            intent: User's intent or goal description for the plan
            engagement_id: Optional engagement ID to link the plan to an existing engagement

        Returns:
            dict: Response containing plan_id, plan_title, and sop (Standard Operating Procedure JSON)
        """
        try:
            url = f"{self.valves['PLANNER_API_URL']}/planner/plan"

            payload = {
                "intent": intent
            }

            if engagement_id is not None:
                payload["engagement_id"] = engagement_id

            response = requests.post(
                url,
                json=payload,
                timeout=self.valves["TIMEOUT"]
            )

            response.raise_for_status()

            return {
                "status": "success",
                "data": response.json()
            }

        except requests.exceptions.Timeout:
            return {
                "status": "error",
                "message": f"Request timed out after {self.valves['TIMEOUT']} seconds"
            }
        except requests.exceptions.ConnectionError as e:
            return {
                "status": "error",
                "message": f"Failed to connect to Planner API: {str(e)}"
            }
        except requests.exceptions.HTTPError as e:
            return {
                "status": "error",
                "message": f"Planner API error: {str(e)}",
                "http_status": response.status_code
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }
