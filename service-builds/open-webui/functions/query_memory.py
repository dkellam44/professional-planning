"""
title: Query Memory
author: Claude Code
version: 0.1.0
"""

import requests
from typing import Optional

class Tools:
    def __init__(self):
        self.valves = {
            "MEMORY_GATEWAY_URL": "http://memory-gateway:8090/api/v1",
            "TIMEOUT": 30
        }

    def query_memory(self, query: str, k: int = 10) -> dict:
        """
        Query the Memory Gateway for relevant memories and information.

        Retrieves memories based on semantic similarity to the query, useful for context-aware responses.

        Args:
            query: The query string to search for in memory
            k: Number of results to return (default: 10, max relevance-based retrieval)

        Returns:
            dict: Response containing results with similarity scores and retrieved memories
        """
        try:
            url = f"{self.valves['MEMORY_GATEWAY_URL']}/memory/recall"

            params = {
                "query": query,
                "k": k
            }

            response = requests.get(
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
                "message": f"Failed to connect to Memory Gateway: {str(e)}"
            }
        except requests.exceptions.HTTPError as e:
            return {
                "status": "error",
                "message": f"Memory Gateway error: {str(e)}",
                "http_status": response.status_code
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}"
            }
