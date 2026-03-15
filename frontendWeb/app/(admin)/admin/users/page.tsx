"use client";

import type { UserWithAgentsCount } from "@claake/shared";
import { MoreHorizontal, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

const roleLabel: Record<string, string> = {
	user: "Utilisateur",
	developer: "Développeur",
	admin: "Admin",
	super_admin: "Super Admin",
};

const roleVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
	user: "outline",
	developer: "secondary",
	admin: "default",
	super_admin: "destructive",
};

export default function AdminUsersPage() {
	const { token } = useAuth();
	const [users, setUsers] = useState<UserWithAgentsCount[]>([]);
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (!token) return;
		apiClient.users
			.list(token)
			.then(setUsers)
			.catch(() => {});
	}, [token]);

	const filtered = users.filter(
		(u) =>
			(u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
			u.email.toLowerCase().includes(search.toLowerCase()) ||
			(roleLabel[u.role] ?? "").toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div>
			<h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
			<p className="mt-2 text-muted-foreground">Gérez les utilisateurs de la plateforme.</p>

			<div className="mt-6 flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Rechercher par nom, email ou rôle..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle className="text-lg">Tous les utilisateurs ({filtered.length})</CardTitle>
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
								{filtered.map((user) => (
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
											<Badge variant={roleVariant[user.role] ?? "outline"}>
												{roleLabel[user.role] ?? user.role}
											</Badge>
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
