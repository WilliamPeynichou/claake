import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
	Animated,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { ClaakeMark } from "../components/ClaakeMark";
import { Glass } from "../components/Glass";
import { GlassButton } from "../components/GlassButton";
import { IconGlass } from "../components/IconGlass";
import { BackIcon, MoreIcon, PlusIcon, SendIcon } from "../components/Icons";
import { Message, MOCK_AGENTS, MOCK_CHATS, SAMPLE_THREAD } from "../data/mock";
import { BRAND, fonts } from "../theme/brand";
import { useTheme } from "../theme/ThemeContext";

function TypingIndicator() {
	const { dark, c } = useTheme();
	const firstDot = useRef(new Animated.Value(0)).current;
	const secondDot = useRef(new Animated.Value(0)).current;
	const thirdDot = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		[firstDot, secondDot, thirdDot].forEach((dot, i) => {
			Animated.loop(
				Animated.sequence([
					Animated.delay(i * 150),
					Animated.timing(dot, { toValue: -5, duration: 400, useNativeDriver: true }),
					Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
					Animated.delay(300),
				]),
			).start();
		});
	}, [firstDot, secondDot, thirdDot]);

	return (
		<View style={styles.typingWrap}>
			<Glass borderRadius={22} style={styles.typingBubble}>
				<View style={styles.typingDots}>
					{[
						["typing-dot-1", firstDot],
						["typing-dot-2", secondDot],
						["typing-dot-3", thirdDot],
					].map(([id, dot]) => (
						<Animated.View
							key={id as string}
							style={[
								styles.dot,
								{
									backgroundColor: BRAND.brand,
									transform: [{ translateY: dot as Animated.Value }],
								},
							]}
						/>
					))}
				</View>
			</Glass>
		</View>
	);
}

function MessageBubble({ msg, index }: { msg: Message; index: number }) {
	const { c } = useTheme();
	const opacity = useRef(new Animated.Value(0)).current;
	const ty = useRef(new Animated.Value(12)).current;
	const scale = useRef(new Animated.Value(0.92)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(opacity, {
				toValue: 1,
				duration: 500,
				delay: index * 40,
				useNativeDriver: true,
			}),
			Animated.spring(scale, { toValue: 1, speed: 14, delay: index * 40, useNativeDriver: true }),
			Animated.timing(ty, { toValue: 0, duration: 500, delay: index * 40, useNativeDriver: true }),
		]).start();
	}, [index, opacity, scale, ty]);

	const isUser = msg.role === "user";

	return (
		<Animated.View
			style={[
				styles.msgRow,
				isUser ? styles.msgUser : styles.msgAgent,
				{ opacity, transform: [{ scale }, { translateY: ty }] },
			]}
		>
			{isUser ? (
				<LinearGradient
					colors={[BRAND.brandLight, BRAND.brand]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={[styles.bubbleUser, styles.bubble]}
				>
					<Text style={[styles.bubbleText, { color: "#fff", fontFamily: fonts.sans }]}>
						{msg.text}
					</Text>
				</LinearGradient>
			) : (
				<Glass borderRadius={22} style={[styles.bubbleAgent, styles.bubble]}>
					<Text style={[styles.bubbleText, { color: c.ink, fontFamily: fonts.sans }]}>
						{msg.text}
					</Text>
				</Glass>
			)}
		</Animated.View>
	);
}

function ChatListView({ onPickAgent }: { onPickAgent: (id: string) => void }) {
	const { dark, c } = useTheme();

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.listContent}
			showsVerticalScrollIndicator={false}
		>
			<Text style={[styles.listTitle, { color: c.ink }]}>
				<Text style={{ fontFamily: fonts.serif }}>Tes </Text>
				<Text style={{ fontFamily: fonts.serifItalic, color: BRAND.brand }}>conversations</Text>
			</Text>

			<View style={styles.chatList}>
				{MOCK_CHATS.map((chat) => {
					const ag = MOCK_AGENTS.find((a) => a.id === chat.agentId);
					return (
						<Glass
							strong
							borderRadius={22}
							key={chat.agentId}
							onPress={() => onPickAgent(chat.agentId)}
							style={styles.chatItem}
						>
							<View style={styles.chatItemInner}>
								<LinearGradient colors={[BRAND.brandLight, BRAND.brand]} style={styles.chatAvatar}>
									<ClaakeMark size={22} color="#fff" bgColor="rgba(255,255,255,0.3)" />
								</LinearGradient>
								<View style={styles.chatItemInfo}>
									<Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: c.ink }}>
										{chat.title}
									</Text>
									<Text
										style={{ fontFamily: fonts.sans, fontSize: 12, color: c.muted }}
										numberOfLines={1}
									>
										{ag?.name} · {chat.preview}
									</Text>
								</View>
								<Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted }}>
									{chat.last}
								</Text>
							</View>
						</Glass>
					);
				})}
			</View>

			<View style={{ alignItems: "center", marginTop: 22 }}>
				<GlassButton
					primary
					icon={<PlusIcon size={16} color="#fff" />}
					onPress={() => onPickAgent("a1")}
				>
					Nouvelle conversation
				</GlassButton>
			</View>
		</ScrollView>
	);
}

function ChatConversationView({ agentId, onBack }: { agentId: string; onBack: () => void }) {
	const { dark, c } = useTheme();
	const agent = MOCK_AGENTS.find((a) => a.id === agentId);
	const [msgs, setMsgs] = useState<Message[]>(SAMPLE_THREAD);
	const [input, setInput] = useState("");
	const [typing, setTyping] = useState(false);
	const scrollRef = useRef<ScrollView>(null);

	const send = () => {
		if (!input.trim()) return;
		const userMessage: Message = {
			id: `user-${Date.now()}`,
			role: "user",
			text: input.trim(),
		};
		setMsgs((m) => [...m, userMessage]);
		setInput("");
		setTyping(true);
		setTimeout(() => {
			setTyping(false);
			setMsgs((m) => [
				...m,
				{
					id: `agent-${Date.now()}`,
					role: "agent",
					text: "Bien reçu. Je regarde ça et je te réponds dans un instant.",
				},
			]);
		}, 1400);
	};

	if (!agent) return null;

	return (
		<KeyboardAvoidingView
			style={styles.flex}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			{/* Header */}
			<View style={styles.convHeader}>
				<IconGlass icon={<BackIcon size={18} color={c.ink} />} onPress={onBack} size={38} />
				<LinearGradient colors={[BRAND.brandLight, BRAND.brand]} style={styles.convAvatar}>
					<ClaakeMark size={20} color="#fff" bgColor="rgba(255,255,255,0.3)" />
				</LinearGradient>
				<View style={{ flex: 1 }}>
					<Text style={{ fontFamily: fonts.serif, fontSize: 18, lineHeight: 18, color: c.ink }}>
						{agent.name}
					</Text>
					<Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted, marginTop: 2 }}>
						<Text style={{ color: BRAND.brand }}>●</Text> en ligne
					</Text>
				</View>
				<IconGlass icon={<MoreIcon size={18} color={c.ink} />} size={38} />
			</View>

			{/* Messages */}
			<ScrollView
				ref={scrollRef}
				style={styles.scroll}
				contentContainerStyle={styles.msgsContent}
				showsVerticalScrollIndicator={false}
				onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
			>
				{msgs.map((m, i) => (
					<MessageBubble key={m.id} msg={m} index={i} />
				))}
				{typing && <TypingIndicator />}
			</ScrollView>

			{/* Composer */}
			<View style={styles.composerWrap}>
				<Glass strong borderRadius={28} style={styles.composer}>
					<View style={styles.composerInner}>
						<TextInput
							value={input}
							onChangeText={setInput}
							onSubmitEditing={send}
							placeholder="Écris un message…"
							placeholderTextColor={c.muted}
							style={[styles.composerInput, { color: c.ink, fontFamily: fonts.sans }]}
						/>
						<Pressable onPress={send} style={styles.sendWrap}>
							<LinearGradient colors={[BRAND.brandLight, BRAND.brand]} style={styles.sendBtn}>
								<SendIcon size={18} color="#fff" />
							</LinearGradient>
						</Pressable>
					</View>
				</Glass>
			</View>
		</KeyboardAvoidingView>
	);
}

export function ChatScreen({
	chatAgentId,
	onChatPress,
	onBack,
}: {
	chatAgentId: string | null;
	onChatPress: (agentId: string) => void;
	onBack: () => void;
}) {
	if (chatAgentId) return <ChatConversationView agentId={chatAgentId} onBack={onBack} />;
	return <ChatListView onPickAgent={onChatPress} />;
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	scroll: { flex: 1 },
	listContent: { paddingTop: 16, paddingBottom: 140, paddingHorizontal: 20 },
	listTitle: { fontSize: 38, lineHeight: 40, letterSpacing: -0.8, marginTop: 10, marginBottom: 20 },
	chatList: { gap: 10, marginBottom: 0 },
	chatItem: { marginBottom: 0 },
	chatItemInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
	chatAvatar: {
		width: 46,
		height: 46,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	chatItemInfo: { flex: 1, minWidth: 0, gap: 3 },
	convHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 20,
		paddingTop: 8,
		paddingBottom: 10,
	},
	convAvatar: {
		width: 40,
		height: 40,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	msgsContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140, gap: 10 },
	msgRow: { flexDirection: "row", maxWidth: "82%" },
	msgUser: { alignSelf: "flex-end" },
	msgAgent: { alignSelf: "flex-start" },
	bubble: { paddingHorizontal: 14, paddingVertical: 10 },
	bubbleUser: { borderRadius: 22, borderBottomRightRadius: 8 },
	bubbleAgent: { borderBottomLeftRadius: 8 },
	bubbleText: { fontSize: 14, lineHeight: 20.3 },
	typingWrap: { alignSelf: "flex-start", marginBottom: 10 },
	typingBubble: { borderBottomLeftRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
	typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
	dot: { width: 7, height: 7, borderRadius: 3.5 },
	composerWrap: { position: "absolute", bottom: 24, left: 16, right: 16, zIndex: 45 },
	composer: { padding: 6 },
	composerInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
	composerInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14 },
	sendWrap: {},
	sendBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: BRAND.brand,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.5,
		shadowRadius: 16,
		elevation: 6,
	},
});
