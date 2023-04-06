import { writable, get } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';
import type { WrappedWritable } from '$lib/types';

export function generateOutput<T, R>(
	inputs: Writable<WrappedWritable<T>>,
	processor: (inputs: T) => R
) {
	const outputStore = writable<R>();

	const updateOutputStore = () => {
		const inputValues = get(inputs);
		const currentInputs = {} as T;

		for (const key in inputValues) {
			currentInputs[key as keyof T] = get(inputValues[key]) as T[keyof T];
		}

		outputStore.update(() => processor(currentInputs));
	};

	const unsubscribeFns: (() => void)[] = [];

	const subscribeToNestedStores = (store: WrappedWritable<T>) => {
		for (const key in store) {
			store[key].subscribe(() => {
				updateOutputStore();
			});
		}
	};

	const unsubscribeInputs = inputs.subscribe((wrappedInputs) => {
		unsubscribeFns.forEach((fn) => fn());
		unsubscribeFns.length = 0;
		subscribeToNestedStores(wrappedInputs);
	});

	return {
		subscribe: outputStore.subscribe,
		unsubscribe: () => {
			unsubscribeInputs();
			unsubscribeFns.forEach((fn) => fn());
		}
	};
}
