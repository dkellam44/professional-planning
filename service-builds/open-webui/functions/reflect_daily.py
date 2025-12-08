"""
title: Reflect Daily
author: Claude Code
version: 0.1.0
"""

import requests

class Tools:
    def __init__(self):
        self.valves = {
            "PLANNER_API_URL": "http://planner-api:8091/api/v1",
            "TIMEOUT": 30
        }

    def reflect_daily(self) -> dict:
        """
        Generate a daily reflection and insights.

        Calls the Planner API observer endpoint to generate a daily reflection summary with insights and recommendations.

        Returns:
            dict: Response containing reflection_summary, insights array, and recommendations list
        """
        try:
            url = f"{self.valves['PLANNER_API_URL']}/observer/reflect"

            params = {
                "mode": "daily"
            }

            response = requests.post(
                url,
                params=params,
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
