export interface StatCardData {
  icon: string;
  value: string;
  label: string;
  subtitle: string;
  iconColor: string;
}

export interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  body: string;
  linkText: string;
}

export interface ModuleItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
}