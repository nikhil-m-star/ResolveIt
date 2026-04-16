import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AlertCircle, Droplets, Zap, Trash2, Lightbulb, MapPin, TreePine, AlertTriangle } from "lucide-react";
import { createElement } from "react";

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

export function getCategoryIconNode(category, className = "") {
  const Icon = getCategoryIcon(category);
  return createElement(Icon, { className });
}

export function getCategoryColor(category) {
  const variants = {
    POTHOLE: "text-primary bg-primary/16 border-primary/45",
    GARBAGE: "text-primary bg-primary/14 border-primary/38",
    WATER_LEAK: "text-primary bg-primary/20 border-primary/50",
    POWER_CUT: "text-primary bg-primary/10 border-primary/32",
    STREETLIGHT: "text-primary bg-primary/18 border-primary/44",
    BRIBERY: "text-primary bg-primary/12 border-primary/35",
    SEWAGE: "text-primary bg-primary/15 border-primary/40",
    TREE_FALLEN: "text-primary bg-primary/17 border-primary/42",
  };
  return variants[category] || "text-primary bg-primary/10 border-primary/30";
}

export function getStatusColor(status) {
  const variants = {
    REPORTED: "text-primary border-primary/30",
    IN_PROGRESS: "text-primary border-primary/45",
    RESOLVED: "text-primary border-primary/60",
    REJECTED: "text-primary border-primary/25",
  };
  return variants[status] || "text-primary border-primary/30";
}

export function evaluateIntensityColor(score) {
  if (!score) return "bg-primary/40";
  if (score <= 3) return "bg-primary/35";
  if (score <= 6) return "bg-primary/55";
  if (score <= 8) return "bg-primary/75";
  return "bg-primary";
}
