/* arc — Tailwind v4 theme */
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: #ffffff;
  --foreground: #3139fb;
  --card: #f8faff;
  --card-foreground: #3139fb;
  --popover: #f8faff;
  --popover-foreground: #3139fb;
  --primary: #3139fb;
  --primary-foreground: #ffffff;
  --secondary: #fffefa;
  --secondary-foreground: #0a0a0a;
  --muted: #f3f7ff;
  --muted-foreground: #7596ff;
  --accent: #fffadd;
  --accent-foreground: #0a0a0a;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --border: #e2ebff;
  --input: #e2ebff;
  --ring: #fffadd;
  --sidebar: #f5f8ff;
  --sidebar-foreground: #3139fb;
  --sidebar-primary: #3139fb;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #fffadd;
  --sidebar-accent-foreground: #0a0a0a;
  --sidebar-border: #e2ebff;
  --sidebar-ring: #fffadd;
  --chart-1: #fffadd;
  --chart-2: #3139fb;
  --chart-3: #fffefa;
  --chart-4: #fffcec;
  --chart-5: #1c2a84;
}

.dark {
  --background: #171715;
  --foreground: #f5f5f4;
  --card: #232321;
  --card-foreground: #f5f5f4;
  --popover: #232321;
  --popover-foreground: #f5f5f4;
  --primary: #6183ff;
  --primary-foreground: #0a0a0a;
  --secondary: #46453e;
  --secondary-foreground: #ffffff;
  --muted: #292927;
  --muted-foreground: #939392;
  --accent: #fffadd;
  --accent-foreground: #0a0a0a;
  --destructive: #ef4444;
  --destructive-foreground: #0a0a0a;
  --border: #3c3c3a;
  --input: #3c3c3a;
  --ring: #fffadd;
  --sidebar: #20201e;
  --sidebar-foreground: #f5f5f4;
  --sidebar-primary: #6183ff;
  --sidebar-primary-foreground: #0a0a0a;
  --sidebar-accent: #fffadd;
  --sidebar-accent-foreground: #0a0a0a;
  --sidebar-border: #3c3c3a;
  --sidebar-ring: #fffadd;
  --chart-1: #fffadd;
  --chart-2: #6183ff;
  --chart-3: #46453e;
  --chart-4: #3139fb;
  --chart-5: #fffcec;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
