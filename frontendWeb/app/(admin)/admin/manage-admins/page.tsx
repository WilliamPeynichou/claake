"use client";

import type { AdminPermissions, UserWithAgentsCount } from "@claake/shared";
import { Shield, ShieldCheck, UserCog, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

const DEFAULT_PERMISSIONS: AdminPermissions = {
	canManageUsers: false,
	canManageAgents: true,
	canManageCategories: true,
	canManageReviews: true,
	canViewStats: true,
	canViewActivity: true,
};

const permissionLabels: Record<keyof AdminPermissions, string> = {
	canManageUsers: "Gérer les utilisateurs",
	canManageAgents: "Gérer les agents",
	canManageCategories: "Gérer les catégories",
	canManageReviews: "Gérer les avis",
	canViewStats: "Voir les statistiques",
	canViewActivity: "Voir l'activité",
};

export default function ManageAdminsPage() {
	const { token, role } = useAuth();
	const [users, setUsers] = useState<UserWithAgentsCount[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserWithAgentsCount | null>(null);
	const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
	const [searchPromote, setSearchPromote] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const isSuperAdmin = role === "super_admin" || role === "SUPER_ADMIN";

	useEffect(() => {
		if (!token) return;
		apiClient.users
			.list(token)
			.then(setUsers)
			.catch(() => {});
	}, [token]);

	if (!isSuperAdmin) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<Shield className="h-12 w-12 text-muted-foreground/30" />
				<h3 className="mt-4 text-lg font-semibold">Accès refusé</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Seul le Super Admin peut gérer les rôles et permissions.
				</p>
			</div>
		);
	}

	const admins = users.filter((u) => u.role === "admin");
	const nonAdmins = users.filter((u) => u.role !== "admin" && u.role !== "super_admin");
	const filteredNonAdmins = nonAdmins.filter(
		(u) =>
			searchPromote === "" ||
			(u.display_name ?? "").toLowerCase().includes(searchPromote.toLowerCase()) ||
			u.email.toLowerCase().includes(searchPromote.toLowerCase()),
	);

	async function handlePromote(user: UserWithAgentsCount) {
		if (!token) return;
		setSaving(true);
		setMessage(null);
		try {
			await apiClient.users.updateRole(user.id, "admin", DEFAULT_PERMISSIONS, token);
			setUsers((prev) =>
				prev.map((u) => (u.id === user.id ? { ...u, role: "admin" as const } : u)),
			);
			setMessage(`${user.display_name ?? user.email} est maintenant admin.`);
		} catch {
			setMessage("Erreur lors de la promotion.");
		} finally {
			setSaving(false);
		}
	}

	async function handleDemote(user: UserWithAgentsCount) {
		if (!token) return;
		setSaving(true);
		setMessage(null);
		try {
			await apiClient.users.updateRole(user.id, "user", null, token);
			setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: "user" as const } : u)));
			setSelectedUser(null);
			setMessage(`${user.display_name ?? user.email} n'est plus admin.`);
		} catch {
			setMessage("Erreur lors de la rétrogradation.");
		} finally {
			setSaving(false);
		}
	}

	async function handleSavePermissions() {
		if (!token || !selectedUser) return;
		setSaving(true);
		setMessage(null);
		try {
			await apiClient.users.updateRole(selectedUser.id, "admin", permissions, token);
			setMessage(
				`Permissions mises à jour pour ${selectedUser.display_name ?? selectedUser.email}.`,
			);
		} catch {
			setMessage("Erreur lors de la mise à jour des permissions.");
		} finally {
			setSaving(false);
		}
	}

	function togglePermission(key: keyof AdminPermissions) {
		setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	return (
		<div>
			<h1 className="text-3xl font-bold">Gestion des admins</h1>
			<p className="mt-2 text-muted-foreground">
				Attribuez le rôle admin et configurez les permissions de chaque administrateur.
			</p>

			{message && (
				<div className="mt-4 rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>
			)}

			<div className="mt-8 grid gap-6 lg:grid-cols-2">
				{/* Current admins */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<ShieldCheck className="h-5 w-5" />
							Administrateurs actifs ({admins.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{admins.length === 0 && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Aucun administrateur configuré.
							</p>
						)}
						{admins.map((admin) => (
							<div
								key={admin.id}
								className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
									selectedUser?.id === admin.id ? "border-primary bg-primary/5" : ""
								}`}
							>
								<div className="flex items-center gap-3">
									<Avatar className="h-8 w-8">
										<AvatarFallback className="text-xs">
											{(admin.display_name ?? "?")
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{admin.display_name}</p>
										<p className="text-xs text-muted-foreground">{admin.email}</p>
									</div>
								</div>
								<div className="flex gap-1">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSelectedUser(admin);
											setPermissions(
												(admin.admin_permissions as AdminPermissions) ?? DEFAULT_PERMISSIONS,
											);
										}}
									>
										<UserCog className="mr-1 h-3 w-3" />
										Permissions
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleDemote(admin)}
										disabled={saving}
									>
										<X className="h-3 w-3 text-destructive" />
									</Button>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Edit permissions */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<UserCog className="h-5 w-5" />
							{selectedUser
								? `Permissions de ${selectedUser.display_name ?? selectedUser.email}`
								: "Sélectionnez un admin"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{selectedUser ? (
							<div className="space-y-4">
								{(Object.keys(permissionLabels) as Array<keyof AdminPermissions>).map((key) => (
									<label
										key={key}
										className="flex cursor-pointer items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
									>
										<span className="text-sm font-medium">{permissionLabels[key]}</span>
										<input
											type="checkbox"
											checked={permissions[key]}
											onChange={() => togglePermission(key)}
											className="h-4 w-4 rounded"
										/>
									</label>
								))}
								<Button className="w-full" onClick={handleSavePermissions} disabled={saving}>
									{saving ? "Enregistrement..." : "Enregistrer les permissions"}
								</Button>
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-8 text-center">
								<UserCog className="h-8 w-8 text-muted-foreground/30" />
								<p className="mt-2 text-sm text-muted-foreground">
									Cliquez sur &quot;Permissions&quot; à côté d&apos;un admin pour modifier ses
									accès.
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Promote section */}
			<Separator className="my-8" />

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Promouvoir un utilisateur admin</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-4">
						<Label>Rechercher un utilisateur</Label>
						<Input
							placeholder="Nom ou email..."
							value={searchPromote}
							onChange={(e) => setSearchPromote(e.target.value)}
							className="mt-1 max-w-sm"
						/>
					</div>
					<div className="max-h-64 space-y-2 overflow-y-auto">
						{filteredNonAdmins.slice(0, 20).map((user) => (
							<div
								key={user.id}
								className="flex items-center justify-between rounded-md border p-3"
							>
								<div className="flex items-center gap-3">
									<Avatar className="h-8 w-8">
										<AvatarFallback className="text-xs">
											{(user.display_name ?? "?")
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{user.display_name}</p>
										<p className="text-xs text-muted-foreground">{user.email}</p>
									</div>
									<Badge variant="outline" className="ml-2">
										{user.role === "developer" ? "Développeur" : "Utilisateur"}
									</Badge>
								</div>
								<Button size="sm" onClick={() => handlePromote(user)} disabled={saving}>
									Promouvoir admin
								</Button>
							</div>
						))}
						{filteredNonAdmins.length === 0 && (
							<p className="py-4 text-center text-sm text-muted-foreground">
								Aucun utilisateur trouvé.
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
