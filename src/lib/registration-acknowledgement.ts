type AcknowledgementClaimClient = {
  team: {
    updateMany(args: {
      where: { id: string; registrationAcknowledgementAttemptedAt: null };
      data: { registrationAcknowledgementAttemptedAt: Date };
    }): Promise<{ count: number }>;
  };
};

export async function claimRegistrationAcknowledgement(
  client: AcknowledgementClaimClient,
  teamId: string,
): Promise<boolean> {
  const result = await client.team.updateMany({
    where: { id: teamId, registrationAcknowledgementAttemptedAt: null },
    data: { registrationAcknowledgementAttemptedAt: new Date() },
  });
  return result.count === 1;
}
