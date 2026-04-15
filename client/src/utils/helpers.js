import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, Droplets, Zap, Trash2, Lightbulb, MapPin, TreePine, AlertTriangle } from "lucide-react";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function getCategoryIcon(category) {
  switch (category) {
    case "POTHOLE": return AlertCircle;
    case "GARBAGE": return Trash2;
    case "WATER_LEAK": return Droplets;
    case "POWER_CUT": return Zap;
    case "STREETLIGHT": return Lightbulb;
    case "BRIBERY": return AlertTriangle;
    case "SEWAGE": return Droplets;
    case "TREE_FALLEN": return TreePine;
    default: return MapPin;
  }
}

export function getCategoryColor(category) {
  switch (category) {
    case "POTHOLE": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "GARBAGE": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "WATER_LEAK": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "POWER_CUT": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "STREETLIGHT": return "text-yellow-300 bg-yellow-300/10 border-yellow-300/20";
    case "BRIBERY": return "text-red-500 bg-red-500/10 border-red-500/20";
    case "SEWAGE": return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    case "TREE_FALLEN": return "text-green-600 bg-green-600/10 border-green-600/20";
    default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getStatusColor(status) {
  switch (status) {
    case "REPORTED": return "text-blue-400 border-blue-400/30";
    case "IN_PROGRESS": return "text-yellow-400 border-yellow-400/30";
    case "RESOLVED": return "text-emerald-400 border-emerald-400/30";
    case "REJECTED": return "text-red-400 border-red-400/30";
    default: return "text-gray-400 border-gray-400/30";
  }
}

export function evaluateIntensityColor(score) {
  if (!score) return "bg-gray-500";
  if (score <= 3) return "bg-emerald-500";
  if (score <= 6) return "bg-yellow-500";
  if (score <= 8) return "bg-orange-500";
  return "bg-red-500";
}
