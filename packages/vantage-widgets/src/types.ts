export interface BannerProps {
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical";
  link?: string;
  onClose?: () => void;
}
