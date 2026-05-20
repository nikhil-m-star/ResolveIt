import React from 'react';
import { 
  AlertCircle, 
  Trash2, 
  Droplets, 
  Zap, 
  Lightbulb, 
  AlertTriangle, 
  TreePine, 
  MapPin,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react-native';

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

export function getCategoryIconComponent(category, size = 20, color = "#10b981") {
  const IconComponent = getCategoryIcon(category);
  return <IconComponent size={size} color={color} />;
}

// Category styling tokens translated for React Native Stylesheets
export function getCategoryStyles(category) {
  const defaults = {
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  };
  
  const variants = {
    POTHOLE: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.16)", borderColor: "rgba(16, 185, 129, 0.45)" },
    GARBAGE: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.14)", borderColor: "rgba(16, 185, 129, 0.38)" },
    WATER_LEAK: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.20)", borderColor: "rgba(16, 185, 129, 0.50)" },
    POWER_CUT: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.10)", borderColor: "rgba(16, 185, 129, 0.32)" },
    STREETLIGHT: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.18)", borderColor: "rgba(16, 185, 129, 0.44)" },
    BRIBERY: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.35)" },
    SEWAGE: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.40)" },
    TREE_FALLEN: { color: "#10b981", bgColor: "rgba(16, 185, 129, 0.17)", borderColor: "rgba(16, 185, 129, 0.42)" },
  };

  return variants[category] || defaults;
}

// Status styling tokens translated for React Native Stylesheets
export function getStatusStyles(status) {
  const defaults = { color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" };
  const variants = {
    REPORTED: { color: "#10b981", borderColor: "rgba(16, 185, 129, 0.30)", text: "REPORTED" },
    IN_PROGRESS: { color: "#10b981", borderColor: "rgba(16, 185, 129, 0.45)", text: "PROCESSING" },
    RESOLVED: { color: "#10b981", borderColor: "rgba(16, 185, 129, 0.60)", text: "RESOLVED" },
    REJECTED: { color: "#10b981", borderColor: "rgba(16, 185, 129, 0.25)", text: "CANCELLED" },
  };
  return variants[status] || defaults;
}

export function evaluateIntensityColor(score) {
  if (!score) return "rgba(16, 185, 129, 0.4)";
  if (score <= 3) return "rgba(16, 185, 129, 0.35)";
  if (score <= 6) return "rgba(16, 185, 129, 0.55)";
  if (score <= 8) return "rgba(16, 185, 129, 0.75)";
  return "#10b981";
}

export function getNotificationIcon(type) {
  switch (type) {
    case "URGENT": return ShieldAlert;
    case "WARNING": return AlertCircle;
    case "SUCCESS": return CheckCircle2;
    default: return Compass;
  }
}
