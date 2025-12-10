// agent-manager.ts
import { AIAgent } from "@/modules/agent";
import type { DirectTransport, Producer, Consumer } from "mediasoup/types";

export class AgentManager {
  private agents = new Map<string, AIAgent>();

  /**
   * Create a new agent or return existing one
   */
  public createAgent(agentId: string): AIAgent {
    let agent = this.agents.get(agentId);
    if (!agent) {
      agent = new AIAgent(agentId);
      this.agents.set(agentId, agent);
    }
    return agent;
  }

  /**
   * Returns existing agent or null
   */
  public getAgent(agentId: string): AIAgent | null {
    return this.agents.get(agentId) ?? null;
  }

  /**
   * Delete agent and clean resources
   */
  public removeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.close();
    agent.reset();
    this.agents.delete(agentId);

    return true;
  }

  public setAgentProducerTransport(agentId: string, transport: DirectTransport) {
    const agent = this.createAgent(agentId);
    agent.setProducerTransport(transport);
  }

  public setAgentConsumerTransport(agentId: string, transport: DirectTransport) {
    const agent = this.createAgent(agentId);
    agent.setConsumerTransport(transport);
  }

  public setAgentProducerTrack(agentId: string, producer: Producer) {
    const agent = this.createAgent(agentId);
    agent.setProducerTrack(producer);
  }

  // Updated: Add consumer track for specific user
  public addAgentConsumerTrack(agentId: string, userId: string, consumer: Consumer) {
    const agent = this.createAgent(agentId);
    agent.addConsumerTrack(userId, consumer);
  }

  // Get consumer track for specific user
  public getAgentConsumerTrack(agentId: string, userId: string): Consumer | undefined {
    const agent = this.getAgent(agentId);
    return agent?.getConsumerTrack(userId);
  }

  // Remove consumer track for specific user
  public removeAgentConsumerTrack(agentId: string, userId: string) {
    const agent = this.getAgent(agentId);
    agent?.removeConsumerTrack(userId);
  }

  public setAgentConnected(agentId: string, connected: boolean) {
    const agent = this.createAgent(agentId);
    agent.setConnected(connected);
  }

  public clearAll() {
    for (const agent of this.agents.values()) {
      agent.close();
      agent.reset();
    }
    this.agents.clear();
  }

  public listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}

export const agentManager = new AgentManager();