import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service.js";
import {
	USER_REPOSITORY,
	type UserRepositoryPort,
} from "../../../users/domain/ports/user.repository.port.js";
import { STRIPE_SERVICE, type StripeServicePort } from "../../domain/ports/stripe.port.js";

@Injectable()
export class CreateConnectAccountUseCase {
	constructor(
		@Inject(STRIPE_SERVICE) private readonly stripe: StripeServicePort,
		@Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
		private readonly prisma: PrismaService,
	) {}

	async execute(userId: string): Promise<{ url: string }> {
		const user = await this.userRepo.findById(userId);
		if (!user) throw new NotFoundException("User not found");

		let accountId = user.stripeAccountId;

		if (!accountId) {
			const result = await this.stripe.createConnectAccount(user.email);
			accountId = result.accountId;
			await this.prisma.user.update({
				where: { id: userId },
				data: { stripeAccountId: accountId },
			});
		}

		const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
		const link = await this.stripe.createAccountLink(accountId, `${webUrl}/dashboard/settings`);

		return { url: link.url };
	}
}
