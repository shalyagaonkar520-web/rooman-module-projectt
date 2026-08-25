# CRM Module

Modern Customer Relationship Management module for ModuleForge applications.

## Overview
Includes complete components and API routes for:
- Contact Management (CRUD operations)
- Lead Kanban Board & Pipeline Stages
- Deal Value & Conversion Tracking
- Interaction History & Notes

## Folder Structure
- `frontend/`: React components (`CRMView.tsx`, `LeadKanban.tsx`)
- `backend/`: Express API endpoints (`crmRoutes.ts`, `crmService.ts`)
- `database/`: SQL tables (`01_crm_schema.sql`)

## Integration Guide
Coding agents: Import `CRMView` into your main layout at route `/crm`. Express backend can mount `crmRoutes` at `/api/crm`.
