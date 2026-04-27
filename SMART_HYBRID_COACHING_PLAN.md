# Smart Hybrid Coaching: Phased Implementation Plan

## Executive Summary

**Plan Purpose:**  
Evolve the current Pace Coach from a purely manual, bi-weekly check-in system into a **Smart Hybrid Coaching** model. This approach combines the low-friction user experience of manual check-ins with passive, automated weekly monitoring to improve data quality, enable early issue detection, and deliver more personalized coaching—without increasing user burden.

**What's Changing from Current Model:**
| Current State | Future State (Hybrid) |
|---------------|----------------------|
| Manual check-in every 10-14 days | Manual check-in retained + **passive weekly scoring** |
| No compliance tracking | Automated weekly compliance score (adherence ≥80%, ≥4 logged days) |
| Single-tier weight trend calculation | **2-tier system**: Week 1 = simple delta; Week 2+ = weekly average delta |
| Check-in logic ignores adherence history | Check-in recommendations factor in **compliance streak** and data quality |
| Reactive (user must initiate) | **Proactive alerts** only when critical issues detected (optional Phase 3) |

**End Goal:**  
A production-ready coaching engine that:
- Maintains low user friction (no new required actions)
- Automatically detects non-compliance or insufficient data
- Delivers more accurate trend-based adjustments using tiered calculations
- Provides coaches/users with visibility into adherence patterns
- Scales safely with boundary safeguards from the original spec

---

## Phased Implementation Plan

### Phase 1: Passive Weekly Compliance Engine
**Objective:** Collect adherence data automatically without any user-facing changes.

**Scope:**
- Create `weekly_metrics` table:
  - `user_id`, `iso_week`, `logged_days`, `compliant_days`, `compliance_score`
  - `avg_calories_logged`, `target_calories`, `weight_logs_count`
  - `adjustment_eligible` (boolean), `hold_reason` (nullable)
- Background job runs every Monday at 00:05 UTC:
  - Evaluates prior ISO week for all active users
  - Calculates compliance score per Module 4 spec (≥80% compliant days AND ≥4 logged days)
  - Flags weeks as `adjustment_eligible = true/false`
  - Stores hold reasons: `NON_COMPLIANT_HOLD`, `INSUFFICIENT_DATA_HOLD`, or null
- No UI changes; existing check-in flow unchanged

**Success Criteria:**
- ✅ Weekly metrics populated for all users with activity in prior week
- ✅ Compliance scores match manual verification
- ✅ Zero impact on existing check-in functionality

**Estimated Effort:** 1-2 days

---

### Phase 2: Tiered Trend Calculation & Enhanced Check-In
**Objective:** Improve adjustment accuracy by implementing 2-tier trend logic and surfacing compliance context during check-ins.

**Scope:**
- Update `PaceCoachService.calculate_trend_rate()`:
  - **Tier 1 (first check-in):** Simple delta = last weight this period − last weight prior period
  - **Tier 2 (subsequent check-ins):** Delta of weekly averages = avg(current_period_weights) − avg(prior_period_weights)
  - Require ≥2 weigh-ins for Tier 2; fallback to Tier 1 if insufficient
- Modify check-in form backend to:
  - Retrieve latest `weekly_metrics` for compliance context
  - Display data quality badge (e.g., "High confidence" vs "Limited data")
  - Include compliance streak in adjustment reasoning (e.g., "3 compliant weeks detected")
- Update adjustment logic to:
  - Skip adjustment if latest week marked `adjustment_eligible = false`
  - Use compliance streak to modulate `adjustment_step_kcal` (optional: larger steps after long compliant streaks)

**Success Criteria:**
- ✅ Trend calculations use correct tier based on check-in history
- ✅ Insufficient data gracefully handled with clear messaging
- ✅ Check-in form displays compliance context without clutter
- ✅ Adjustments respect compliance eligibility flags

**Estimated Effort:** 2-3 days

---

### Phase 3 (Optional): Smart Triggers & Proactive Nudges
**Objective:** Add optional proactive engagement for users trending off-track.

**Scope:**
- Define trigger conditions:
  - 2+ consecutive non-compliant weeks
  - 3+ weeks with insufficient weigh-ins
  - Weight trend opposite to goal for 2+ check-ins
- Implement notification system:
  - In-app banner on next login: "We noticed your last 2 weeks had limited logging. Want to adjust your plan?"
  - Optional push/email (configurable per user)
- Add "Quick Reset" flow:
  - Allow users to re-confirm goals or adjust targets mid-cycle if triggered
  - Resets `consecutive_compliant_weeks` per original spec Module 5

**Success Criteria:**
- ✅ Triggers fire only under defined conditions
- ✅ Users can dismiss or act on nudges
- ✅ No increase in support tickets or confusion

**Estimated Effort:** 1-2 days

---

## Risk Mitigation & Rollback Strategy

- **Feature Flags:** Each phase behind a flag (`hybrid_coaching_phase1`, etc.)
- **Backward Compatibility:** Existing check-in flow remains default until phase fully validated
- **Monitoring:** Track `adjustment_applied` rates, compliance score distribution, and user engagement pre/post each phase
- **Rollback:** Disable feature flag to revert to current behavior instantly

---

## Timeline Summary

| Phase | Duration | User-Facing Changes | Risk Level |
|-------|----------|---------------------|------------|
| Phase 1 | 1-2 days | None | Low |
| Phase 2 | 2-3 days | Enhanced check-in context | Medium |
| Phase 3 | 1-2 days | Optional nudges | Low-Medium |
| **Total** | **4-7 days** | Gradual rollout | Managed |

---

## Next Steps

Upon approval:
1. Confirm feature flag naming convention
2. Prioritize Phase 1 sprint placement
3. Define success metrics dashboard requirements
