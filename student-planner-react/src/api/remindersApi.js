import { apiRequest } from "./apiClient.js";
export const getReminders=(state="upcoming")=>apiRequest(`/api/reminders?state=${state}&limit=100`);
export const getDueReminders=()=>apiRequest("/api/reminders/due?limit=100");
export const createReminder=data=>apiRequest("/api/reminders",{method:"POST",body:JSON.stringify(data)});
export const updateReminder=(id,data)=>apiRequest(`/api/reminders/${id}`,{method:"PATCH",body:JSON.stringify(data)});
export const dismissReminder=id=>updateReminder(id,{dismissed:true});
export const deleteReminder=id=>apiRequest(`/api/reminders/${id}`,{method:"DELETE"});
