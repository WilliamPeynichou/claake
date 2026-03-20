"use client";

import { useEffect, useState } from "react";

interface DelayedSpinnerProps {
	delay?: number;
}

export function DelayedSpinner({ delay = 500 }: DelayedSpinnerProps) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShow(true), delay);
		return () => clearTimeout(timer);
	}, [delay]);

	if (!show) return null;

	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
		</div>
	);
}
