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
  Compass,
  ShieldAlert,
} from 'lucide-react-native';

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getCategoryIcon(category) {
  switch (category) {
    case 'POTHOLE':
      return AlertCircle;
    case 'GARBAGE':
      return Trash2;
    case 'WATER_LEAK':
      return Droplets;
    case 'POWER_CUT':
      return Zap;
    case 'STREETLIGHT':
      return Lightbulb;
    case 'BRIBERY':
      return AlertTriangle;
    case 'SEWAGE':
      return Droplets;
    case 'TREE_FALLEN':
      return TreePine;
    default:
      return MapPin;
  }
}

export function getCategoryIconComponent(category, size = 20, color = '#10b981') {
  const IconComponent = getCategoryIcon(category);
  return <IconComponent size={size} color={color} />;
}

export function getCategoryStyles(category) {
  const defaults = {
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  };

  const variants = {
    POTHOLE: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.16)' },
    GARBAGE: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.14)' },
    WATER_LEAK: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.18)' },
    POWER_CUT: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    STREETLIGHT: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
    BRIBERY: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
    SEWAGE: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.14)' },
    TREE_FALLEN: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)' },
  };

  return variants[category] || defaults;
}

export function getStatusStyles(status) {
  const defaults = { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' };
  const variants = {
    REPORTED: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', text: 'REPORTED' },
    IN_PROGRESS: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.14)', text: 'PROCESSING' },
    RESOLVED: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.18)', text: 'RESOLVED' },
    REJECTED: { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.08)', text: 'CANCELLED' },
  };
  return variants[status] || defaults;
}

export function evaluateIntensityColor(score) {
  if (!score) return 'rgba(16, 185, 129, 0.4)';
  if (score <= 3) return 'rgba(16, 185, 129, 0.35)';
  if (score <= 6) return 'rgba(16, 185, 129, 0.55)';
  if (score <= 8) return 'rgba(16, 185, 129, 0.75)';
  return '#10b981';
}

export function getNotificationIcon(type) {
  switch (type) {
    case 'URGENT':
      return ShieldAlert;
    case 'WARNING':
      return AlertCircle;
    case 'SUCCESS':
      return CheckCircle2;
    default:
      return Compass;
  }
}
