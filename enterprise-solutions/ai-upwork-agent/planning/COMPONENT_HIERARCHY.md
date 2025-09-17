# Component Hierarchy & UI Architecture

## 🎯 Component Architecture Philosophy

### **Design Principles**
1. **Composability** - Small, focused components that can be combined
2. **Reusability** - Components work across different contexts
3. **Accessibility** - WCAG 2.1 AA compliance by default
4. **Performance** - Server Components by default, Client Components when needed
5. **Type Safety** - Strict TypeScript interfaces for all props

### **Component Categories**
- **Primitive UI** - Basic building blocks (Button, Input, Card)
- **Composite UI** - Complex assembled components (DataTable, Form)
- **Layout** - Structure and navigation components
- **Business Logic** - Domain-specific feature components
- **Provider** - Context and state management components

## 🏗️ Component Tree Structure

```
App (Server Component)
├── ClerkProvider (Client Provider)
├── ThemeProvider (Client Provider)
├── QueryClientProvider (Client Provider)
├── TenantProvider (Client Provider)
└── AppShell (Server Component)
    ├── AppHeader (Server Component)
    │   ├── Logo (Server Component)
    │   ├── MainNavigation (Client Component)
    │   │   ├── NavigationItem (Client Component)
    │   │   └── NavigationDropdown (Client Component)
    │   ├── SearchBar (Client Component)
    │   ├── ThemeToggle (Client Component)
    │   ├── NotificationBell (Client Component)
    │   ├── OrganizationSwitcher (Client Component - Clerk)
    │   └── UserButton (Client Component - Clerk)
    ├── AppSidebar (Client Component)
    │   ├── SidebarNavigation (Client Component)
    │   │   ├── NavSection (Server Component)
    │   │   ├── NavItem (Client Component)
    │   │   └── NavItemWithSubmenu (Client Component)
    │   ├── QuickActions (Client Component)
    │   │   ├── NewProposalButton (Client Component)
    │   │   ├── JobSearchButton (Client Component)
    │   │   └── AnalyticsButton (Client Component)
    │   ├── StatusIndicators (Client Component)
    │   │   ├── APIStatus (Client Component)
    │   │   ├── SyncStatus (Client Component)
    │   │   └── AlertsCount (Client Component)
    │   └── SidebarFooter (Server Component)
    ├── MainContent (Server Component)
    │   ├── PageHeader (Server Component)
    │   │   ├── PageTitle (Server Component)
    │   │   ├── PageDescription (Server Component)
    │   │   ├── Breadcrumbs (Server Component)
    │   │   └── PageActions (Client Component)
    │   ├── DashboardModule (Server Component)
    │   │   ├── OverviewTab
    │   │   │   ├── MetricsGrid (Server Component)
    │   │   │   │   ├── MetricCard (Server Component)
    │   │   │   │   │   ├── MetricIcon (Server Component)
    │   │   │   │   │   ├── MetricValue (Server Component)
    │   │   │   │   │   ├── MetricLabel (Server Component)
    │   │   │   │   │   └── MetricTrend (Client Component)
    │   │   │   │   └── MetricCardSkeleton (Server Component)
    │   │   │   ├── RecentActivity (Server Component)
    │   │   │   │   ├── ActivityList (Server Component)
    │   │   │   │   ├── ActivityItem (Server Component)
    │   │   │   │   └── ActivityItemSkeleton (Server Component)
    │   │   │   └── QuickActionsGrid (Client Component)
    │   │   │       ├── QuickActionCard (Client Component)
    │   │   │       └── CreateProposalCard (Client Component)
    │   │   ├── JobsModule
    │   │   │   ├── JobsHeader (Server Component)
    │   │   │   │   ├── JobsStats (Server Component)
    │   │   │   │   ├── JobsActions (Client Component)
    │   │   │   │   └── ViewToggle (Client Component)
    │   │   │   ├── JobsFilters (Client Component)
    │   │   │   │   ├── FilterBar (Client Component)
    │   │   │   │   ├── AdvancedFilters (Client Component)
    │   │   │   │   │   ├── SkillsFilter (Client Component)
    │   │   │   │   │   ├── BudgetFilter (Client Component)
    │   │   │   │   │   ├── LocationFilter (Client Component)
    │   │   │   │   │   ├── ClientFilter (Client Component)
    │   │   │   │   │   └── DateFilter (Client Component)
    │   │   │   │   ├── SavedSearches (Client Component)
    │   │   │   │   │   ├── SavedSearchItem (Client Component)
    │   │   │   │   │   └── CreateSavedSearch (Client Component)
    │   │   │   │   └── FilterChips (Client Component)
    │   │   │   ├── JobsList (Server Component)
    │   │   │   │   ├── JobCard (Client Component)
    │   │   │   │   │   ├── JobHeader (Server Component)
    │   │   │   │   │   │   ├── JobTitle (Server Component)
    │   │   │   │   │   │   ├── JobMeta (Server Component)
    │   │   │   │   │   │   └── JobActions (Client Component)
    │   │   │   │   │   ├── JobDescription (Server Component)
    │   │   │   │   │   ├── JobSkills (Server Component)
    │   │   │   │   │   ├── JobBudget (Server Component)
    │   │   │   │   │   ├── ClientInfo (Server Component)
    │   │   │   │   │   │   ├── ClientName (Server Component)
    │   │   │   │   │   │   ├── ClientRating (Server Component)
    │   │   │   │   │   │   ├── ClientStats (Server Component)
    │   │   │   │   │   │   └── ClientVerifications (Server Component)
    │   │   │   │   │   ├── JobFooter (Client Component)
    │   │   │   │   │   │   ├── SaveJobButton (Client Component)
    │   │   │   │   │   │   ├── ApplyButton (Client Component)
    │   │   │   │   │   │   └── ShareButton (Client Component)
    │   │   │   │   │   └── JobStatus (Server Component)
    │   │   │   │   ├── JobCardSkeleton (Server Component)
    │   │   │   │   └── LoadMoreButton (Client Component)
    │   │   │   └── JobsGrid (Alternative view)
    │   │   ├── ProposalsModule
    │   │   │   ├── ProposalsHeader (Server Component)
    │   │   │   │   ├── ProposalsStats (Server Component)
    │   │   │   │   └── ProposalsActions (Client Component)
    │   │   │   ├── ProposalEditor (Client Component)
    │   │   │   │   ├── EditorToolbar (Client Component)
    │   │   │   │   │   ├── FormatButtons (Client Component)
    │   │   │   │   │   ├── AIAssistantButton (Client Component)
    │   │   │   │   │   ├── TemplateSelector (Client Component)
    │   │   │   │   │   └── SaveButton (Client Component)
    │   │   │   │   ├── EditorContent (Client Component)
    │   │   │   │   │   ├── RichTextEditor (Client Component)
    │   │   │   │   │   ├── VariablePlaceholders (Client Component)
    │   │   │   │   │   └── WordCount (Client Component)
    │   │   │   │   ├── EditorSidebar (Client Component)
    │   │   │   │   │   ├── JobSummary (Server Component)
    │   │   │   │   │   ├── ClientInsights (Server Component)
    │   │   │   │   │   ├── SimilarProposals (Server Component)
    │   │   │   │   │   └── WritingTips (Server Component)
    │   │   │   │   └── EditorFooter (Client Component)
    │   │   │   │       ├── PreviewButton (Client Component)
    │   │   │   │       ├── SendButton (Client Component)
    │   │   │   │       └── SaveDraftButton (Client Component)
    │   │   │   ├── AIAssistant (Client Component)
    │   │   │   │   ├── AIChat (Client Component)
    │   │   │   │   │   ├── ChatMessages (Client Component)
    │   │   │   │   │   ├── ChatInput (Client Component)
    │   │   │   │   │   └── SuggestedPrompts (Client Component)
    │   │   │   │   ├── AIFeatures (Client Component)
    │   │   │   │   │   ├── VoiceMatching (Client Component)
    │   │   │   │   │   ├── ToneAdjustment (Client Component)
    │   │   │   │   │   ├── ContentSuggestions (Client Component)
    │   │   │   │   │   └── FactChecking (Client Component)
    │   │   │   │   └── AISettings (Client Component)
    │   │   │   ├── TemplateLibrary (Server Component)
    │   │   │   │   ├── TemplateGrid (Server Component)
    │   │   │   │   ├── TemplateCard (Client Component)
    │   │   │   │   │   ├── TemplatePreview (Server Component)
    │   │   │   │   │   ├── TemplateActions (Client Component)
    │   │   │   │   │   └── TemplateStats (Server Component)
    │   │   │   │   ├── CreateTemplate (Client Component)
    │   │   │   │   └── TemplateFilters (Client Component)
    │   │   │   └── ProposalHistory (Server Component)
    │   │   │       ├── ProposalList (Server Component)
    │   │   │       ├── ProposalItem (Client Component)
    │   │   │       │   ├── ProposalSummary (Server Component)
    │   │   │       │   ├── ProposalStatus (Server Component)
    │   │   │       │   └── ProposalActions (Client Component)
    │   │   │       └── ProposalFilters (Client Component)
    │   │   ├── ClientsModule
    │   │   │   ├── ClientsHeader (Server Component)
    │   │   │   ├── ClientResearch (Client Component)
    │   │   │   │   ├── ClientSearchBar (Client Component)
    │   │   │   │   ├── ClientFilters (Client Component)
    │   │   │   │   └── ClientSuggestions (Server Component)
    │   │   │   ├── ClientGrid (Server Component)
    │   │   │   │   ├── ClientCard (Client Component)
    │   │   │   │   │   ├── ClientAvatar (Server Component)
    │   │   │   │   │   ├── ClientInfo (Server Component)
    │   │   │   │   │   ├── ClientStats (Server Component)
    │   │   │   │   │   ├── RiskAssessment (Server Component)
    │   │   │   │   │   │   ├── RiskScore (Server Component)
    │   │   │   │   │   │   ├── RiskFactors (Server Component)
    │   │   │   │   │   │   └── RiskRecommendations (Server Component)
    │   │   │   │   │   └── ClientActions (Client Component)
    │   │   │   │   └── ClientCardSkeleton (Server Component)
    │   │   │   └── ClientDetails (Server Component)
    │   │   │       ├── ClientProfile (Server Component)
    │   │   │       ├── ClientHistory (Server Component)
    │   │   │       ├── ClientProjects (Server Component)
    │   │   │       └── ClientAnalytics (Server Component)
    │   │   └── AnalyticsModule
    │   │       ├── AnalyticsHeader (Server Component)
    │   │       ├── PerformanceDashboard (Server Component)
    │   │       │   ├── KPICards (Server Component)
    │   │       │   ├── PerformanceCharts (Client Component)
    │   │       │   │   ├── LineChart (Client Component)
    │   │       │   │   ├── BarChart (Client Component)
    │   │       │   │   ├── PieChart (Client Component)
    │   │       │   │   └── AreaChart (Client Component)
    │   │       │   └── PerformanceTrends (Client Component)
    │   │       ├── RevenueTracking (Server Component)
    │   │       │   ├── RevenueOverview (Server Component)
    │   │       │   ├── RevenueCharts (Client Component)
    │   │       │   ├── ProjectProfitability (Server Component)
    │   │       │   └── EarningsForecasts (Client Component)
    │   │       ├── SuccessMetrics (Server Component)
    │   │       │   ├── ProposalSuccess (Server Component)
    │   │       │   ├── ClientRetention (Server Component)
    │   │       │   ├── TimeToHire (Server Component)
    │   │       │   └── SatisfactionScores (Server Component)
    │   │       └── TrendAnalysis (Client Component)
    │   │           ├── TrendCharts (Client Component)
    │   │           ├── SeasonalPatterns (Client Component)
    │   │           ├── MarketComparison (Client Component)
    │   │           └── Predictions (Client Component)
    │   └── ErrorBoundary (Client Component)
    └── AppFooter (Server Component)
        ├── FooterContent (Server Component)
        ├── StatusBar (Client Component)
        │   ├── ConnectionStatus (Client Component)
        │   ├── SyncStatus (Client Component)
        │   └── LastUpdated (Client Component)
        └── HelpCenter (Client Component)
```

## 🎨 UI Component Library Structure

### **Primitive Components (shadcn/ui)**
```typescript
// Button component with variants
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// Card component with composable structure
interface CardProps {
  children: ReactNode;
  className?: string;
}

// Input component with validation
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}
```

### **Composite Components**
```typescript
// DataTable component
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

// Form component with validation
interface FormProps {
  schema: ZodSchema;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  children: ReactNode;
}

// Modal/Dialog component
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
}
```

## 🏢 Business Logic Components

### **Job Management Components**
```typescript
// JobCard component
interface JobCardProps {
  job: Job;
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  onShare: (jobId: string) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

// JobFilters component
interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  savedSearches: SavedSearch[];
  onSaveSearch: (search: SavedSearch) => void;
}
```

### **Proposal Management Components**
```typescript
// ProposalEditor component
interface ProposalEditorProps {
  job?: Job;
  template?: Template;
  initialContent?: string;
  onSave: (content: string) => void;
  onSend: (content: string, bidAmount: number) => void;
  aiAssistantEnabled?: boolean;
}

// AIAssistant component
interface AIAssistantProps {
  context: {
    job?: Job;
    client?: Client;
    userProfile?: UserProfile;
  };
  onSuggestion: (suggestion: string) => void;
  features: ('voice-matching' | 'tone-adjustment' | 'content-generation')[];
}
```

### **Analytics Components**
```typescript
// PerformanceChart component
interface PerformanceChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'area' | 'pie';
  timeRange: TimeRange;
  metric: 'success-rate' | 'revenue' | 'proposals' | 'interviews';
  showComparison?: boolean;
}

// MetricCard component
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string;
  };
  icon?: ReactNode;
  loading?: boolean;
}
```

## 🔄 State Management Integration

### **Component State Patterns**
```typescript
// Local component state with hooks
const JobCard = ({ job }: JobCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(job.saved);

  // Global state integration
  const { saveJob, unsaveJob } = useJobsStore();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const handleSave = () => {
    if (isSaved) {
      unsaveJob(job.id);
      trackEvent('job_unsaved', { jobId: job.id });
    } else {
      saveJob(job.id);
      trackEvent('job_saved', { jobId: job.id });
    }
    setIsSaved(!isSaved);
  };

  return (
    <Card className="job-card">
      {/* Component content */}
    </Card>
  );
};
```

### **Context Provider Structure**
```typescript
// TenantProvider for multi-tenancy
interface TenantContextValue {
  currentTenant: Tenant | null;
  switchTenant: (tenantId: string) => void;
  permissions: Permission[];
  hasPermission: (resource: string, action: string) => boolean;
}

// ThemeProvider for dark/light mode
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
}
```

## 📱 Responsive Design Components

### **Adaptive Component Patterns**
```typescript
// Responsive layout components
const ResponsiveLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-3">
        <Sidebar />
      </aside>
      <main className="lg:col-span-9">
        {children}
      </main>
    </div>
  );
};

// Mobile-first component variants
const JobsView = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return isMobile ? <JobsList /> : <JobsGrid />;
};
```

### **Component Composition Patterns**
```typescript
// Compound component pattern
const JobsModule = {
  Root: JobsModuleRoot,
  Header: JobsHeader,
  Filters: JobsFilters,
  List: JobsList,
  Grid: JobsGrid,
  Card: JobCard,
  Actions: JobActions
};

// Usage example
<JobsModule.Root>
  <JobsModule.Header>
    <JobsModule.Filters />
  </JobsModule.Header>
  <JobsModule.List>
    {jobs.map(job => (
      <JobsModule.Card key={job.id} job={job}>
        <JobsModule.Actions />
      </JobsModule.Card>
    ))}
  </JobsModule.List>
</JobsModule.Root>
```

## 🧪 Component Testing Strategy

### **Testing Patterns**
```typescript
// Component unit tests
describe('JobCard', () => {
  it('displays job information correctly', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
  });

  it('handles save action', async () => {
    const onSave = jest.fn();
    render(<JobCard job={mockJob} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(mockJob.id);
  });
});

// Integration tests
describe('JobsModule', () => {
  it('filters jobs correctly', async () => {
    render(<JobsModule />);

    fireEvent.change(screen.getByLabelText(/skills/i), {
      target: { value: 'React' }
    });

    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });
});
```

## 🎯 Performance Optimization

### **Component Optimization Patterns**
```typescript
// Memoization for expensive components
const JobCard = memo(({ job, onSave }: JobCardProps) => {
  return (
    <Card>
      {/* Component content */}
    </Card>
  );
}, (prevProps, nextProps) => {
  return prevProps.job.id === nextProps.job.id &&
         prevProps.job.updatedAt === nextProps.job.updatedAt;
});

// Lazy loading for heavy components
const AIAssistant = lazy(() => import('./ai-assistant'));
const AnalyticsChart = lazy(() => import('./analytics-chart'));

// Virtual scrolling for large lists
const JobsList = () => {
  const { data: jobs, isLoading } = useInfiniteQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
  });

  return (
    <VirtualList
      height={600}
      itemCount={jobs.length}
      itemSize={200}
      renderItem={({ index, style }) => (
        <div style={style}>
          <JobCard job={jobs[index]} />
        </div>
      )}
    />
  );
};
```

This component hierarchy provides a scalable, maintainable, and performant foundation for the AI Upwork Agent platform with clear separation of concerns and optimal user experience.