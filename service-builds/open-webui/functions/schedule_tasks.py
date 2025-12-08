"""
title: Schedule Tasks
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

    def schedule_tasks(self, plan_id: int, start_date: Optional[str] = None) -> dict:
        """
        Schedule tasks from a plan into the calendar.

        Calls the Planner API scheduler to create calendar events and task schedule for a given plan.

        Args:
            plan_id: The ID of the plan to schedule tasks for
            start_date: Optional start date for the schedule (ISO 8601 format: YYYY-MM-DD)

        Returns:
            dict: Response containing scheduler_run_id, events_created count, and calendar_events list
        """
        try:
            url = f"{self.valves['PLANNER_API_URL']}/scheduler/schedule"

            payload = {
                "plan_id": plan_id
            }

            if start_date is not None:
                payload["start_date"] = start_date

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
