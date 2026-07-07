"use client";

import { useCallback, useReducer } from "react";
import { type AgentBuilderForm, INITIAL_AGENT_FORM, type SetField } from "./agent-builder.types";

type Action =
	| { type: "SET_FIELD"; field: keyof AgentBuilderForm; value: string }
	| { type: "HYDRATE"; patch: Partial<AgentBuilderForm> }
	| { type: "RESET" };

function reducer(state: AgentBuilderForm, action: Action): AgentBuilderForm {
	switch (action.type) {
		case "SET_FIELD":
			return { ...state, [action.field]: action.value };
		case "HYDRATE":
			return { ...state, ...action.patch };
		case "RESET":
			return INITIAL_AGENT_FORM;
		default:
			return state;
	}
}

/** État du formulaire builder + actions typées, partagé create/edit. */
export function useAgentBuilderForm(initial: AgentBuilderForm = INITIAL_AGENT_FORM) {
	const [form, dispatch] = useReducer(reducer, initial);

	const setField = useCallback<SetField>((field, value) => {
		dispatch({ type: "SET_FIELD", field, value: value as string });
	}, []);

	const hydrate = useCallback((patch: Partial<AgentBuilderForm>) => {
		dispatch({ type: "HYDRATE", patch });
	}, []);

	const reset = useCallback(() => dispatch({ type: "RESET" }), []);

	return { form, setField, hydrate, reset };
}
