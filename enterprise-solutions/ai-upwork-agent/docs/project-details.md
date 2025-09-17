# Upwork API Complete Documentation & Data Extraction Guide

Based on comprehensive research, here's the complete documentation on **Upwork API data capabilities** and what you can extract and process for your AI-powered proposal automation system.

## API Overview & Current Status

**Upwork has transitioned to GraphQL API exclusively** - the REST API was deprecated in December 2023. The current API uses **GraphQL endpoints** with OAuth 2.0 authentication and provides access to marketplace data, user profiles, contracts, and messaging systems.[1][2]

### Key API Specifications

- **Base URL**: `https://api.upwork.com/graphql`[3]
- **Authentication**: OAuth 2.0 (RFC 6749 compliant)[4]
- **Rate Limits**: 10 requests/second per IP, 40,000 requests/day maximum[5][6]
- **Data Format**: JSON responses via GraphQL queries
- **Pagination**: Cursor-based pagination with maximum 100 items per request[3]

## Complete Data Extraction Capabilities

### 1. Job Marketplace Data

**Primary Query**: `marketplaceJobPostingsSearch`[1][3]

**Available Job Data Fields**:
- **Core Information**: `id`, `title`, `description`, `ciphertext`, `createTime`, `publishTime`
- **Budget & Pricing**: `hourlyBudgetMin`, `hourlyBudgetMax`, `fixedPriceAmount`, `jobType` (HOURLY/FIXED)
- **Requirements**: `skills` (array), `experienceLevel`, `contractorTier`, `duration`
- **Classification**: `category`, `subcategory`, occupation details
- **Application Data**: `totalApplicants`, `applicationCost` (connects), `featured` status
- **Location**: Client location, timezone, `preferredFreelancerLocation`

**Sample GraphQL Query**:
```graphql
query {
  marketplaceJobPostings```rch(
    marketPl```JobFilter: { 
      title```ression_eq: "React developer```   }
    searchType: USER```BS_SEARCH
    sort```ributes: { field: RECENCY }
  ```
    totalCount
    edges {
      node {
        id
        title```      description
        skills
        hourlyB```etMin
        hourlyBudgetMax
        cre```dDateTime
        ciphertext
        client```          location {
            country
            city
          }
          ```alSpent
          hireRate
        ```     }
    }
    ```eInfo {
      hasNextPage
      endCursor
    }```}
}
```

### 2. Client Information Data

**Available Client Fields** (within job queries):
- **Identity**: Client name, company information, industry
- **Location**: City, country, timezone
- **Verification**: `paymentMethodVerified`, `phoneNumberVerified`, `enterprise` status
- **History**: `totalSpent`, `totalHires`, `hireRate`, `connectedAt` (join date)
- **Ratings**: `feedbackScore`, `feedbackCount`, average ratings given
- **Company Details**: `companySize`, industry classification

### 3. Freelancer Profile Data

**Primary Query**: `freelancerProfileRecords`[1]

**Available Freelancer Fields**:
- **Profile**: Name, title, hourly rate, job success score, availability
- **Skills**: Skills array, expertise levels, certifications
- **Portfolio**: Portfolio items, work samples, project descriptions  
- **Performance**: Ratings, reviews, earnings history, completion rates
- **Location**: Country, city, languages, timezone preferences
- **Verification**: Profile completeness, test scores, identity verification

### 4. Contract & Proposal Data

**Contract Information** (authenticated users only):
- **Contract Details**: ID, status, title, start/end dates, total budget
- **Terms**: Milestones, payment schedule, work description, deliverables
- **Feedback**: Client and freelancer ratings, comments, completion status
- **History**: All past contracts, earnings per contract, relationship duration

**Proposal Data** (limited access):
- **Proposal Content**: Bid amount, timeline, cover letter text
- **Metadata**: Submission date, connects used, proposal status
- **Questions**: Client questions and freelancer responses
- **Performance**: Response rates, proposal success rates

### 5. Financial & Performance Data

**Available Financial Fields** (account owners only):
- **Earnings**: Project-based earnings, total income, payment history
- **Payments**: Withdrawal records, payment methods, fee breakdowns
- **Documents**: Invoices, tax documents, financial statements
- **Analytics**: Earnings trends, payment timing, fee analysis

## Data Processing Capabilities for Automation### Real-Time Job Monitoring
- **Fresh Job Data**: Jobs appear in API within minutes of posting[7]
- **Filtering Options**: 40+ filter parameters including keywords, budget, location, client history
- **Alert Systems**: Can monitor for specific criteria and trigger automated responses

### Client Analysis & Scoring
- **Risk Assessment**: Payment verification, spending history, hire rates
- **Opportunity Scoring**: Budget ranges, project complexity, client quality metrics
- **Relationship Building**: Historical hiring patterns, preferred freelancer types

### Proposal Optimization
- **Historical Analysis**: Past proposal performance, successful bid patterns
- **Competition Intelligence**: Freelancer profiles, pricing strategies, skill positioning
- **Voice Matching**: Extract writing styles from successful historical proposals

## API Permissions & Scopes**Required Permissions for Automation System**:
- `pub-marketplace-job-postings:read:all` - Job listings access
- `freelancer-profile-access:read` - Freelancer profile data
- `contract:read` - Contract history and details
- `message:read` - Message threads (if implementing messaging)
- `organization:read` - Company/team information

## Automation Architecture Recommendations

### Rate Limiting Strategy
- Implement request queuing with 10 requests/second throttling
- Use cursor-based pagination for large datasets
- Cache frequently accessed data (client profiles, skill taxonomies)

### Data Pipeline Architecture
```
Upwork GraphQL API → Rate Limiter → Data```ocessor → Vector Database
     ↓                ```  ↓             ↓              ```ob Monitoring → Authentication```AI Analysis → Embedding Storage  
Client```oring → Error Handler```Pattern Matching → Historical Archive
```

### Key Integration Points for Your System

1. **Job Discovery Pipeline**: Use `marketplaceJobPostingsSearch` with sophisticated filters
2. **Client Intelligence**: Extract client data for risk assessment and opportunity scoring  
3. **Historical Analysis**: Leverage contract history for proposal pattern recognition
4. **Real-Time Alerts**: Implement polling mechanisms for new job notifications
5. **Proposal Generation**: Use client data + job requirements for AI-powered content creation

## Implementation Considerations

**Authentication Requirements**:
- Individual API keys tied to specific Upwork accounts[8][9]
- OAuth 2.0 flow implementation required
- Token refresh needed every 2 weeks[4]

**Data Freshness**:
- Job data: Real-time (within minutes)
- Profile data: Cached (~15 minute delay)
- Contract data: Real-time for active contracts

**Export & Processing**:
- Primary format: JSON via GraphQL
- CSV/XML requires additional processing
- Vector embeddings needed for similarity matching

This comprehensive API documentation provides the foundation for building your advanced Upwork automation system with AI-powered proposal generation, client analysis, and performance tracking capabilities.
