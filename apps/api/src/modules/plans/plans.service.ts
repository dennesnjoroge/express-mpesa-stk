import { plansRepository } from "./plans.repository.js";

export class PlansService {
  async getAll() {
    return await plansRepository.getAll();
  }
}

export const plansService = new PlansService();
