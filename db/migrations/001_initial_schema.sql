-- ============================================================
-- IncidentFlow
-- Migration: 001_initial_schema.sql
-- Initial Database Schema
-- ============================================================


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    role VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TEAM MEMBERS
-- Many-to-many: Users <-> Teams
-- ============================================================

CREATE TABLE team_members (
    team_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    PRIMARY KEY (team_id, user_id),

    FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INCIDENTS
-- ============================================================

CREATE TABLE incidents (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    severity VARCHAR(20) NOT NULL
        CHECK (
            severity IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    status VARCHAR(30) NOT NULL
        CHECK (
            status IN (
                'OPEN',
                'ACKNOWLEDGED',
                'INVESTIGATING',
                'MITIGATED',
                'RESOLVED'
            )
        ),

    created_by BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (created_by)
        REFERENCES users(id)
);


-- ============================================================
-- INCIDENT ASSIGNMENTS
-- Many-to-many: Incidents <-> Users
-- ============================================================

CREATE TABLE incident_assignments (
    incident_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (incident_id, user_id),

    FOREIGN KEY (incident_id)
        REFERENCES incidents(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);


-- ============================================================
-- INCIDENT TIMELINE
-- ============================================================

CREATE TABLE incident_timeline (
    id BIGSERIAL PRIMARY KEY,

    incident_id BIGINT NOT NULL,

    actor_id BIGINT,

    event_type VARCHAR(50) NOT NULL,

    message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (incident_id)
        REFERENCES incidents(id)
        ON DELETE CASCADE,

    FOREIGN KEY (actor_id)
        REFERENCES users(id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_incidents_status
ON incidents(status);

CREATE INDEX idx_incidents_severity
ON incidents(severity);

CREATE INDEX idx_incidents_created_at
ON incidents(created_at);

CREATE INDEX idx_incidents_created_by
ON incidents(created_by);

CREATE INDEX idx_incident_timeline_incident_id
ON incident_timeline(incident_id);

CREATE INDEX idx_incident_assignments_user_id
ON incident_assignments(user_id);

CREATE INDEX idx_team_members_user_id
ON team_members(user_id);