import { Palette } from './palette';

/** Borderless UI — separation via surface contrast, spacing, and soft shadow */
export const UI = {
  screen: {
    flex: 1,
    backgroundColor: Palette.background},
  card: {
    backgroundColor: Palette.surfaceElevated,
    borderRadius: 16},
  cardSoft: {
    backgroundColor: Palette.surface,
    borderRadius: 16},
  input: {
    backgroundColor: Palette.glass,
    borderRadius: 14},
  chip: {
    backgroundColor: Palette.glass,
    borderRadius: 999},
  pill: {
    backgroundColor: Palette.surface,
    borderRadius: 12},
  shadowSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6},
  shadowNav: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12}} as const;
