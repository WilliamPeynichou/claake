"use client";

import type { UserWithAgentsCount } from "@agentplace/shared";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const roleLabel: Record<string, string> = {
	user: "Utilisateur",
	developer: "Développeur",
	admin: "Admin",
};

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
	user: "outline",
	developer: "secondary",
	admin: "default",
};

export default function AdminUsersPage() {
	const [users, setUsers] = useState<UserWithAgentsCount[]>([]);

	useEffect(() => {
		let isMounted = true;

		async function loadUsers() {
			const token = await getAccessToken();
			if (!token) return;

			try {
				const nextUsers = await apiClient.users.list(token);
				if (isMounted) {
					setUsers(nextUsers);
				}
			} catch {}
		}

		loadUsers();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<div>
			<h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
			<p className="mt-2 text-muted-foreground">Gérez les utilisateurs de la plateforme.</p>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle className="text-lg">Tous les utilisateurs ({users.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b text-left">
									<th className="pb-3 font-medium text-muted-foreground">Utilisateur</th>
									<th className="pb-3 font-medium text-muted-foreground">Email</th>
									<th className="pb-3 font-medium text-muted-foreground">Rôle</th>
									<th className="pb-3 font-medium text-muted-foreground">Agents</th>
									<th className="pb-3 font-medium text-muted-foreground">Inscrit le</th>
									<th className="pb-3 font-medium text-muted-foreground">Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => (
									<tr key={user.id} className="border-b last:border-0">
										<td className="py-3">
											<div className="flex items-center gap-2">
												<Avatar className="h-8 w-8">
													<AvatarFallback className="text-xs">
														{(user.display_name ?? "?")
															.split(" ")
															.map((n) => n[0])
															.join("")}
													</AvatarFallback>
												</Avatar>
												<span className="font-medium">{user.display_name}</span>
											</div>
										</td>
										<td className="py-3 text-muted-foreground">{user.email}</td>
										<td className="py-3">
											<Badge variant={roleVariant[user.role]}>{roleLabel[user.role]}</Badge>
										</td>
										<td className="py-3">{user.agents_count}</td>
										<td className="py-3">
											{new Date(user.created_at).toLocaleDateString("fr-FR")}
										</td>
										<td className="py-3">
											<Button variant="ghost" size="icon">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
