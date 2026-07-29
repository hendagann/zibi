import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...rest }: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </Base>
  );
}

export function TopicsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5.5" cy="18" r="2.5" />
      <circle cx="18.5" cy="18" r="2.5" />
      <path d="M12 7.5v3.5M12 11h-6.5v4.5M12 11h6.5v4.5" />
    </Base>
  );
}

export function PracticeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="m8.5 11 2 2 4-4.5" />
    </Base>
  );
}

export function ExamIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9.5V13l2.2 1.5" />
      <path d="M9 2.5h6" />
    </Base>
  );
}

export function ProgressIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20V10M10 20V5M16 20v-7M22 20H2" />
    </Base>
  );
}

export function AdminIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 4 6.5v5c0 4.5 3.4 8.3 8 9.5 4.6-1.2 8-5 8-9.5v-5z" />
      <path d="m9.2 12 2 2 3.6-4" />
    </Base>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}

export const navIcons = {
  dashboard: DashboardIcon,
  topics: TopicsIcon,
  practice: PracticeIcon,
  exam: ExamIcon,
  progress: ProgressIcon,
  admin: AdminIcon,
} as const;

export type NavIconName = keyof typeof navIcons;
