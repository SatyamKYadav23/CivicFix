const stateMachineService = require('../../src/services/stateMachine.service');
const AppError = require('../../src/utils/appError');

describe('StateMachineService Unit Tests', () => {
  const citizenUser = { id: 'cit-1', role: 'CITIZEN' };
  const otherCitizen = { id: 'cit-2', role: 'CITIZEN' };
  const workerUser = { id: 'wrk-1', role: 'WORKER', department: 'Water Supply & Sewerage' };
  const otherWorker = { id: 'wrk-2', role: 'WORKER', department: 'Water Supply & Sewerage' };
  const authWater = { id: 'auth-1', role: 'AUTHORITY', department: 'Water Supply & Sewerage' };
  const authRoads = { id: 'auth-2', role: 'AUTHORITY', department: 'Roads & Highways' };
  const adminUser = { id: 'adm-1', role: 'ADMIN' };

  describe('Citizen Transitions', () => {
    it('should allow citizen to cancel their own SUBMITTED complaint', () => {
      const complaint = { id: 'c-1', citizenId: 'cit-1', status: 'SUBMITTED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'CANCELLED', citizenUser);
      }).not.toThrow();
    });

    it('should prevent citizen from cancelling another citizen complaint', () => {
      const complaint = { id: 'c-1', citizenId: 'cit-2', status: 'SUBMITTED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'CANCELLED', citizenUser);
      }).toThrow(AppError);
    });

    it('should prevent citizen from illegal jump directly to RESOLVED', () => {
      const complaint = { id: 'c-1', citizenId: 'cit-1', status: 'SUBMITTED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'RESOLVED', citizenUser);
      }).toThrow(AppError);
    });

    it('should allow citizen to reopen a RESOLVED complaint', () => {
      const complaint = { id: 'c-1', citizenId: 'cit-1', status: 'RESOLVED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'REOPENED', citizenUser);
      }).not.toThrow();
    });
  });

  describe('Worker Transitions', () => {
    it('should allow assigned worker to move ASSIGNED task to IN_PROGRESS', () => {
      const complaint = {
        id: 'c-2',
        citizenId: 'cit-1',
        assignedWorkerId: 'wrk-1',
        status: 'ASSIGNED',
        category: 'WATER_SUPPLY',
      };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'IN_PROGRESS', workerUser);
      }).not.toThrow();
    });

    it('should prevent worker from modifying a task assigned to another worker', () => {
      const complaint = {
        id: 'c-2',
        citizenId: 'cit-1',
        assignedWorkerId: 'wrk-2',
        status: 'ASSIGNED',
        category: 'WATER_SUPPLY',
      };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'IN_PROGRESS', workerUser);
      }).toThrow(AppError);
    });

    it('should allow assigned worker to submit resolution from IN_PROGRESS', () => {
      const complaint = {
        id: 'c-2',
        citizenId: 'cit-1',
        assignedWorkerId: 'wrk-1',
        status: 'IN_PROGRESS',
        category: 'WATER_SUPPLY',
      };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'RESOLUTION_SUBMITTED', workerUser);
      }).not.toThrow();
    });
  });

  describe('Authority Jurisdiction Transitions', () => {
    it('should allow authority with matching department to review a SUBMITTED complaint', () => {
      const complaint = { id: 'c-3', citizenId: 'cit-1', status: 'SUBMITTED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'UNDER_REVIEW', authWater);
      }).not.toThrow();
    });

    it('should reject authority without department jurisdiction over the complaint category', () => {
      const complaint = { id: 'c-3', citizenId: 'cit-1', status: 'SUBMITTED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'UNDER_REVIEW', authRoads);
      }).toThrow(AppError);
    });
  });

  describe('Admin Universal Transitions', () => {
    it('should allow admin to perform valid state transitions regardless of department', () => {
      const complaint = { id: 'c-4', citizenId: 'cit-1', status: 'SUBMITTED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'UNDER_REVIEW', adminUser);
      }).not.toThrow();
    });

    it('should reject invalid transition even for admin (e.g. CANCELLED to IN_PROGRESS)', () => {
      const complaint = { id: 'c-4', citizenId: 'cit-1', status: 'CANCELLED', category: 'WATER_SUPPLY' };
      expect(() => {
        stateMachineService.validateTransition(complaint, 'IN_PROGRESS', adminUser);
      }).toThrow(AppError);
    });
  });
});

