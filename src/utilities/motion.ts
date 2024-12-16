import { animate } from 'motion/mini'
import { inView, spring, stagger } from 'motion'
import type { DynamicAnimationOptions } from 'motion/react'

type KeyframeStyles = {
	[K in Exclude<keyof CSSStyleDeclaration, number>]?: (string | number)[]
}

type Animations = {
	[key: string]: KeyframeStyles
}

type InViewOptions = {
	amount: number
}

type Styles = {
	[key in 'transform' | 'opacity']?: string | number
}

export class MotionManager {
	#animationAttribute: string
	#animations: Animations
	#delay: number
	#delayAttribute: string
	#optionsAnimate: DynamicAnimationOptions
	#optionsInView: InViewOptions
	#staggerAttribute: string
	#staggerDelay: number
	#targets: NodeListOf<HTMLElement>

	constructor() {
		this.#animations = {
			down: {
				transform: ['translateY(-20px)', 'translateY(0)'],
				opacity: [0, 1]
			},
			'down-right': {
				transform: ['translate(-20px, -20px)', 'translate(0, 0)'],
				opacity: [0, 1]
			},
			'down-left': {
				transform: ['translate(20px, -20px)', 'translate(0, 0)'],
				opacity: [0, 1]
			},
			fade: {
				opacity: [0, 1]
			},
			right: {
				transform: ['translateX(-20px)', 'translateX(0)'],
				opacity: [0, 1]
			},
			'scale-up-left': {
				transform: ['translate(100px, -20px) scale(0.9)', 'scale(1)'],
				opacity: [0, 1]
			},
			up: {
				transform: ['translateY(20px)', 'translateY(0)'],
				opacity: [0, 1]
			},
			'up-left': {
				transform: ['translate(100px, 20px)', 'translate(0, 0)'],
				opacity: [0, 1]
			},
			'up-right': {
				transform: ['translate(-100px, 20px)', 'translate(0, 0)'],
				opacity: [0, 1]
			}
		}
		this.#animationAttribute = 'data-motion'
		this.#delay = 0
		this.#delayAttribute = 'data-motion-delay'
		this.#optionsAnimate = {
			type: spring,
			bounce: 0.3,
			duration: 0.8
		}
		this.#optionsInView = {
			amount: 0.5
		}
		this.#staggerDelay = 0.1
		this.#staggerAttribute = 'data-motion-stagger'
		this.#targets = document.querySelectorAll(
			`[${this.#animationAttribute}]`
		)

		if (!this.#targets.length) return

		// Set default styles for each element
		this.#targets.forEach(this.#setStylesOnElementsOutsideView)

		// Animate elements when they are in view
		this.#targets.forEach(this.#setScrollListener)
	}

	set delay(delay: number) {
		this.#delay = delay
	}

	set optionsAnimate(options: DynamicAnimationOptions) {
		this.#optionsAnimate = options
	}

	set optionsInView(value: InViewOptions) {
		this.#optionsInView = value
	}

	set staggerDelay(value: number) {
		this.#staggerDelay = value
	}

	#createAnimationOptions = (target: Element): DynamicAnimationOptions => {
		const delay = this.#getAnimationDelay(target)
		const shouldStagger = this.#shouldAnimationStagger(target)

		return {
			delay: shouldStagger
				? stagger(delay === 0 ? this.#staggerDelay : delay)
				: delay,
			...this.#optionsAnimate
		}
	}

	#getAnimationDelay = (target: Element) => {
		return Number(target.getAttribute(this.#delayAttribute)) ?? this.#delay
	}

	#getAnimationName = (target: Element) => {
		return target.getAttribute(this.#animationAttribute) ?? ''
	}

	#getAnimationTarget = (target: Element) => {
		return target.getAttribute(this.#staggerAttribute) ?? target
	}

	#getStartingStyles = (target: Element): Styles | void => {
		const animationName = this.#getAnimationName(target)
		const styles = this.#animations[animationName]
		if (!this.#animations[animationName] || !styles) return

		return Object.fromEntries(
			Object.entries(styles).map(([key, values]) => [key, values[0]])
		)
	}

	#inViewCallback = (observerEntry: IntersectionObserverEntry) => {
		const { target } = observerEntry

		// If the animation is not valid, stop
		const animationName = this.#getAnimationName(target)
		if (!this.#animations[animationName]) return

		const animationTarget = this.#getAnimationTarget(target)
		const options = this.#createAnimationOptions(target)

		animate(animationTarget, this.#animations[animationName], options)
	}

	#setDefaultStylesOnElement = async (
		element: HTMLElement,
		styles: Styles
	) => {
		element.setAttribute(
			'style',
			[
				element.getAttribute('style') ?? '',
				...Object.entries(styles).map(
					([key, value]) => `${key}:${value}`
				)
			]
				.filter(Boolean)
				.join(';')
		)
	}

	#setScrollListener = (element: Element) => {
		inView(element, this.#inViewCallback, this.#optionsInView)
	}

	#setStylesOnElementsOutsideView = (element: HTMLElement) => {
		const { amount } = this.#optionsInView
		const styles = this.#getStartingStyles(element)
		if (!styles) return

		const observer = new IntersectionObserver(
			([entry]) => {
				observer.disconnect()
				if (entry.intersectionRatio >= amount) return

				if (!this.#shouldAnimationStagger(element)) {
					this.#setDefaultStylesOnElement(element, styles)
					return
				}
				// Get all elements that should be staggered
				const selector = element.getAttribute(this.#staggerAttribute)
				if (!selector) return
				element.querySelectorAll(selector).forEach((target) => {
					this.#setDefaultStylesOnElement(
						target as HTMLElement,
						styles
					)
				})
			},
			{ threshold: [amount] }
		)

		observer.observe(element)
	}

	#shouldAnimationStagger = (target: Element) => {
		return target.hasAttribute(this.#staggerAttribute)
	}
}
