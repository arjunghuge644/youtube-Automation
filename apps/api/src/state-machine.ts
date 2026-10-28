import type { ProjectStatus } from '@creatorflow/shared';
import { ApiError } from './errors.js';

export class ProductionStateMachine {
  static assertCanStartScriptGeneration(status: ProjectStatus): void {
    if (!['DRAFT', 'SCRIPT_REVIEW', 'FAILED'].includes(status)) {
      throw new ApiError(
        400,
        'INVALID_STATE_TRANSITION',
        `Cannot start script generation while project is in status "${status}". Only DRAFT, SCRIPT_REVIEW, or FAILED allow script generation.`,
      );
    }
  }

  static assertCanEditScript(status: ProjectStatus, approved: boolean): void {
    if (status !== 'SCRIPT_REVIEW' || approved) {
      throw new ApiError(
        400,
        'SCRIPT_LOCKED',
        'Scripts can only be edited while in SCRIPT_REVIEW and before explicit approval. Unapprove or reject to edit.',
      );
    }
  }

  static assertCanApproveScript(status: ProjectStatus, hasScript: boolean): void {
    if (status !== 'SCRIPT_REVIEW' || !hasScript) {
      throw new ApiError(
        400,
        'INVALID_APPROVAL_STATE',
        'Cannot approve script: project must be in SCRIPT_REVIEW with a generated script available.',
      );
    }
  }

  static assertCanStartScenePlanning(status: ProjectStatus, scriptApproved: boolean): void {
    if (!scriptApproved) {
      throw new ApiError(
        400,
        'SCRIPT_NOT_APPROVED',
        'The script must be explicitly approved before scene planning can begin.',
      );
    }
    if (!['SCRIPT_REVIEW', 'SCENES_REVIEW', 'FAILED'].includes(status)) {
      throw new ApiError(
        400,
        'INVALID_STATE_TRANSITION',
        `Cannot start scene planning while project is in status "${status}".`,
      );
    }
  }

  static assertCanEditScenePlan(status: ProjectStatus, approved: boolean): void {
    if (status !== 'SCENES_REVIEW' || approved) {
      throw new ApiError(
        400,
        'SCENE_PLAN_LOCKED',
        'Scene plans can only be edited while in SCENES_REVIEW and before explicit approval.',
      );
    }
  }

  static assertCanApproveScenePlan(status: ProjectStatus, hasScenes: boolean): void {
    if (status !== 'SCENES_REVIEW' || !hasScenes) {
      throw new ApiError(
        400,
        'INVALID_APPROVAL_STATE',
        'Cannot approve scene plan: project must be in SCENES_REVIEW with a valid scene plan available.',
      );
    }
  }
}

