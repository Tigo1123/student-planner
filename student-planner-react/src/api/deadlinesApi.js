import { apiRequest } from "./apiClient.js";
export function getDeadlines({today,includeCompleted=false}={}){const params=new URLSearchParams({today,includeCompleted:String(includeCompleted),limitPerType:"100"});return apiRequest(`/api/deadlines?${params}`)}
