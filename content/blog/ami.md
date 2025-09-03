---
external: false
title: "Advanced machine intelligence for the rest of us"
description: "Using Active Inference to design intelligent machines."
date: 2025-11-11
draft: true
---

Goal: Explain active inference to normal people without turning off researchers.

To do: watch MoroccoAI talk again and pick one thing to focus on rather than the multiple perspectives style Friston uses

To do: do an examples pass on the outline - add examples where relevant.
- Jonas Tyroller graph search gamedev analogy
- Explain Markov Blankets using [[Physics as information processing]]	
- Tool use
- Yann LeCun
	- Architecture similarity to POMDP
	- Collapse risk
- Rich Sutton - OaK https://youtu.be/gEbbGyNkR2U
	- Note similarities
	- Policies
	- Transition model (todo: dive deeper into transitions in the planning chapter)
# Outline

## Intro ideas
Active inference is a way of understanding sentient behavior. 
- Unifies perception and action
- To feel is to palpate, to see is to look, to hear is to listen. Not simply trying to make sense of sensations, but actively create our sensorium.
- The imperative of self-evidencing.
	- *Have expectations* about the kind of states you're usually in (safe, fed, warm, etc.).
	- *Sample the world* (look, touch, hear) and compare your senses to those expectations.
	- If the difference is small - keep going.
	- If the difference is big:
		- *Act* to reduce the difference.
		- Learn from the situation (update your model).
	- *Explore* when you're unsure.
	- 

## 0. Intro
0. Just a perspective on intelligence, not aimed to replace other frameworks.
1. The world is big, uncertain and noisy.
2. Let's say your goal is to persist in *any* uncertain environment.
	1. What does it mean to persist?
	2. Take a look at this clump of particles.
	3. Dispersion probability visualizations (add screenshots from [Thomas Parr talk](https://youtu.be/iPMGLWM5le0))
		1. Show points affected by random fluctuations.
		2. Left system gradually loses form (diffuses), other system maintains form in spite of the same forces.
		3. Show probability distribution
	4. Persistence = resisting dissipation.
	5. Things that persist in the world have common trait.
	6. Minimize the surprise of sensory observations.
	7. Surprise = how much your observations differ from your predictions.
	8. Free energy principle - the dynamics that govern resistance to dissipation.
3. Why does minimizing surprise lead to persistence?
	1. Climbing probability hills means we spend more time in probable states and less time in improbable states.
	2. Less surprise over time lets us become better at predicting.
	3. Better prediction means finding more opportunities to resist dispersion.
	4. Temperature control example.
		1. Too hot -> find shade.
		2. The sun will go down -> it will be cold ->  find shelter before sunset.
		3. Winter is coming -> gather supplies to withstand prolonged cold.
	5. Prediction alone is not enough.
	6. To reduce your body temperature when you're in the sun, you need to be able to move to be in the shade.
	7. More generally - we can *act* to move closer to states we prefer.
	8. We live in an uncertain world.
	9. We can *act* to reduce noise or find better information.
	10. Action + perception loop
		1. Predict sensations and their causes.
		2. Act to match senses to preferences, or reduce uncertainty.
		3. Learn - update your model of the world.
	11. Active inference
	12. Standing on the shoulders of giants

## 1. Inference

0. Let's start with inference.
	1. Understanding the world.
	2. Guessing the hidden cause of observations.
1. When someone says something, what do they actually mean? ("How are you?" story)
	1. I've been living in the UK for 10+ years.
	2. Last month I found out something fascinating.
	3. Did you know that when British people ask "How are you?", they don't actually want to hear how you *really* are?
	4. It turns out I've been unknowingly tormenting people for years, by responding with what I actually felt at the moment.
	5. Little did I know, they're just trying to greet you. "How are you? Good, you? Good, you? Good.. You?" (squint smile)
	6. After I realized that I ran to my friend Kieran Parker to complain about how embarrassed I felt, but he said "Never change, that's my favorite thing about you."
	7. So maybe I should keep doing that in case someone else likes it and we become good friends.
	8. Or maybe I'll learn some basic civility?
	9. As the saying goes "What's there to say, it's so obvious."
	10. That's a bit of a convoluted example of inference, let's look for a simpler one.
	11. "Is it raining"
		1. Look through the window.
		2. Look for wet ground.
		3. Is it actually raining?
		4. Find puddle with ripples. (maybe skip 3 and 4 for simplicity)
		5. Are the ripples caused by wind or raindrops? 

### 1.1 Bayesian inference
0. Bayes was a statistician who lived in England in the 18th century.
1. Bayes' theorem $$ P(y \mid x )P(x) = P(x \mid y)P(y) $$
2. We have states of the world $x$ causing sensations $y$ 
3. We form beliefs about the causes of our senses using a generative model. 
4. Generative model is a composition of 
	1. The likelihood $P(y \mid x)$ - how plausible are the observations we've made are given the states of the world.
	2. A prior probability $P(x)$ - how plausible are things in the world before observation.
5. When we invert that model, we get 
	1. Posterior distribution $P(x \mid y)$ of causes given the data
	2. Evidence $P(y)$ (also called marginal likelihood) - measure of the fit of the model to the data it's trying to explain
6. The climbing of probability distributions in the example earlier can be interpreted as the process of maximizing the evidence of some model.
7. Posterior inference on the rain example, we want to find the probability $p_\theta$ of rain $z$ given wet ground $x$.  $$
p_{\theta}(z \mid x)
= \frac{p_{\theta}(x \mid z)\, p_{\theta}(z)}{p_{\theta}(x)}
= \frac{p_{\theta}(x \mid z)\, p_{\theta}(z)}
	 {\int p_{\theta}(x \mid z)\, p_{\theta}(z)\, dz}
$$
8.  Legend $$ \text{probability} = p $$$$ \text{our assumptions} = \theta $$$$ \text{rain} = z $$$$ \text{wet ground = x} $$	   
9. There is a problem here. 
10. The integral of all the possible causes (in the denominator) is difficult or impossible to compute because $z$ is high-dimensional.  
11. But we can approximate it with variational inference [[Brain-like variational inference]] (Hadi Vafaii)
12. "Variational" here comes from calculus of variations, which uses small changes functions to find maxima and minima of higher order functions (functionals).
13. Even if we can't find the exact posterior distribution, we can it we can use variational calculus to optimize something called the Evidence Lower Bound (ELBO, derivation here https://arxiv.org/html/2410.19315v2#A1) $$
\log p_{\theta}(x)
= \mathbb{E}_{z \sim q_{\phi}(z \mid x)}
\left[
\log \frac{p_{\theta}(x, z)}{q_{\phi}(z \mid x)}
\right]
+ \mathrm{D}_{\mathrm{KL}}\!\left(q_{\phi}(z \mid x)\,\|\,p_{\theta}(z \mid x)\right)
$$
15. ELBO is equivalent to negative variational free energy
16. Maximising ELBO = minimizing free energy
17. Using free energy minimization, we can derive seemingly disparate algorithms, such as variational autoencoders, predictive coding and sparse coding.
18. Even though ELBO and negative free energy are promising, they're vague about implementation.
	1. People often discover methods empirically, which are later recognized as instances of these principles.
	2. E.g. diffusion models originally about non-equilibrium statistical mechanics - later understood as ELBO maximization.
	3. In neuroscience, predictive coding was proposed as a heuristic model for minimizing prediction error, before being reinterpreted as free energy minimization.
19. [Bayesian learning rule](https://arxiv.org/html/2107.04562v4) (BLR) Khan and Rue paper says you can take successful learning algorithms like Adam, Dropout, SGD, you can cast them as instances of variational inference. The paper shows unification potential of variational inference in a machine learning context.
20. Empirical benefits of variational free energy minimization [Vafaii, Galor, Yates 2018](arxiv.org/html/2410.19315v2):
	1. Convergence properties - reaching a stable and accurate representation of an input over time.
		- The Vafaii paper frames inference as a dynamical process of convergence to attractor states in a neural state space. These attractor states are considered faithful representations of the inputs.
		- This "temporal unfolding" of neural dynamics is consistent with recurrent processing observed in biological neural circuits.
	2. Sparsity-reconstruction trade-off: The balance between the number of latent variables and the accuracy of reconstructing the input from them. Improving sparsity comes at the cost of reconstruction and vice-versa.
	3. Out of domain generalization.
21. Inference loop: 
	1. Predict
	2. Sense
	3. Learn - update beliefs (we'll talk about this later)
22. "Perception as unconscious inference" (Helmholtz 1867). The brain is a prediction machine. A statistical organ that predicts external states of the world. (Bayesian brain)
23. Quote by Helmholtz: "Each movement we make by which we alter the appearance of objects should be thought of as an experiment designed to test whether we have understood correctly the invariant relations of the phenomena before us, that is, their existence in definite spatial relations."
24. Perception as hypothesis testing.
25. Perception is not just a projection of the senses. 
26. Photons projecting on our retinas are only half of "the picture" we see.
27. The other half is made from us inferring the causes of those senses.
28. Analogy: Thin dual-side photographic paper, senses "flash" creates image on one side, inference creates image on other side, in the end we get 1 image from the combination.

## 2. Action
0. What is action?
	1. So far we've looked at inference by itself.
	2. What happens if we add the capacity to act?
	3. We get a new dimension of freedom - the ability to choose less surprising data.
	4. A new behavior emerges.
	5. Self-evidencing - the process of gathering evidence for my predictions.
	6. Keeping yourself in preferred or informative situations so that your senses continue to make your model of “what I am and where I belong” the best explanation.

1. How does action practically happen? (muscle reflex analogy)
	1. Action as a side effect of prediction.
	2. For example: the act of grabbing a bottle of water from the table.
	3. I'm starting from a resting position
	4. The first step is to predict the senses of motion in my arm (proprioceptive senses) a few steps in the future as I'm reaching for the bottle
	5. Sequence of proprioceptive sense predictions
	6. Once we have the predictions, the next step is to kick off the movement
	7. Suppress my current senses - telling myself "you're moving" when you're actually not moving (gaslighting yourself in a way)
	8. Now we can start measuring the difference between my prediction and current state
	9. And then, moment to moment, mechanistically resolve that difference into muscle contractions, aiming to match the proprioception from my prediction  
	10. Mechanistic resolution of prediction errors - reflex arcs 
	11. Practical ways of doing this - inverse kinematics, Taylor series approximation
	12. Example of physical intelligence - [cat jumping into a narrow hole](https://www.youtube.com/shorts/1wJ5kYaO710) 

Action = sequence of sensations.

This framing lets us simplify inference by eliminating the need to predict muscle contractions for actions we haven't yet taken. This conserves energy, because the world can change by the time we're ready to move.

Variational free energy is *retrospective*, function of past and present observations. It's not very good at prospecting forms of inference about the future. 

## 3. Free energy formulas
Free energy formulas for the nerds. I'm putting these here so that the mathematicians in the room don't get mad at me for being too vague. $$
\begin{aligned}
F[Q, y] &= \underbrace{-\mathbb{E}_{Q(x)}[\ln P(y,x)]}_{\text{Energy}} - \underbrace{H[Q(x)]}_{\text{Entropy}} \\

&= \underbrace{D_{KL}[Q(x) \parallel P(x)]}_{\text{Complexity}} - \underbrace{\mathbb{E}_{Q(x)}[\ln P(y \mid x)]}_{\text{Accuracy}} \\

&= \underbrace{D_{KL}[Q(x) \parallel P(x \mid y)]}_{\text{Divergence}} - \underbrace{\ln P(y)}_{\text{Evidence}}

\end{aligned}
$$
	1. The "complexity - accuracy" perspective lets us balance between the most plausible and least complicated explanation of our sensations.
	2. Least complicated matters because it takes energy to change your mind. (thermodynamic cost)

To do: add implications of each free energy decomposition from https://www.learnactiveinference.org/
## 4. Planning
1. Planning as Bayesian inference - choosing what to do based on prior beliefs and likelihoods
2. Sequence of actions = policy ($\pi$)
3. Action - influences the world.
4. Policy - a hypothesis about a behavior.
5. Generating "what if" counterfactual simulations of the consequences of policies.
6. What would happen if I look left or right?
7. Knowing how a policy influence state transitions lets us compute the likelihood of a sequence of observations.
8. Planning loop
	1. Generate "what if" policy and observations that would follow it. 
	2. Repeat a few times.
	3. Compute a score for each policy.
	4. Form belief about which policy to pursue.

*Expected free energy* - the score we'll use to rank policies.

Expected free energy $G$ is different from variational free energy $F$. Calculating $G$ involves future policy-dependent observations, while $F$ considers past and present observations.

1. Integrating over all time steps of a policy to calculate it.
2. Similar to potential energy in physics - expected free energy is expressed with log probability
3. Decision-making


$$
\begin{aligned}
G(\pi) &=
- \underbrace{\mathbb{E}_{Q(\tilde{x}, \tilde{y} \mid \pi)}[D_{KL}[Q(\tilde{x} \mid \tilde{y}, \pi) \parallel Q(\tilde{x} \mid \pi))]]}_{\text{Information gain}}
- \underbrace{\mathbb{E}_{Q(\tilde{y} \mid \pi)}[\ln(P(\tilde{y} \mid C))]}_{\text{Pragmatic value}} \\

&= \underbrace{\mathbb{E}_{Q(\tilde{x} \mid \pi)}[H[P(\tilde{y} \mid \tilde{x})]]}_{\text{Expected ambiguity}} + \underbrace{D_{KL}[Q(\tilde{y}\mid \pi) \parallel P(\tilde{y} \mid C)]}_{\text{Risk (outcomes)}} \\

&\leq \underbrace{\mathbb{E}_{Q(\tilde{x} \mid \pi)}[H[P(\tilde{y} \mid \tilde{x})]]}_{\text{Expected ambiguity}} + \underbrace{D_{KL}[Q(\tilde{x}\mid \pi) \parallel P(\tilde{x} \mid C)]}_{\text{Risk (states)}} \\

&= \underbrace{\mathbb{E}_{Q(\tilde{x}, \tilde{y} \mid \pi)}[\ln P(\tilde{y},  \tilde{x} \mid C)]]}_{\text{Expected energy}} + \underbrace{H[Q(\tilde{x} \mid \pi)]}_{\text{Entropy}}

\end{aligned}
$$

$$
Q(\tilde{x}, \tilde{y} \mid \pi) \triangleq
Q(\tilde{x} \mid \pi)
P(\tilde{y} \mid \pi)
$$
## 5. Learning
Updating our generative model of how the world works.
1. Learning = update of the generative model’s parameters for better future inference.
2. Driven by precision-weighted prediction errors at the Markov blanket.
3. Precision = confidence in a belief or prediction.
4. What is a Markov blanket?
5. Learn anything
6. Online (runtime) learning
	1. The world is big - there's more to learn than we have capacity for.
	2. The world is constantly changing.
	3. It's not like climbing a mountain, more like surfing a stormy ocean.
	4. Abstractions can become obsolete.
	5. Advanced intelligence should be learning constantly.
7. Online means your prior constantly gets updated as time goes on - online. Rich Sutton calls this runtime (as opposed to design time). ![[static vs online inference.png]]
8. If you want to do online inference, you should do *natural gradient descent* on the variational objective. We're optimizing the posterior, which is a probability distribution whose its parameters don't live in Euclidian space. There's an intrinsic geometry induced by the Fisher metric and if you don't respect that geometry you will perform poorly.
9. What's the Fisher metric? Don't ask me, I'm not a statistician.
10. Learning prediction spaces


## 6. Hierarchy
POMDP

To do: read Active Inference Tree Search in Large POMDPs https://arxiv.org/pdf/2103.13860v6

### 7. Vlady ideas
- Plans as graphs (data structures perspective)
- Walking the graph
	- Adding nodes upward increases abstraction
	- Adding nodes downward increases specificity
	- Horizontal expansion adds steps in time
- Yann LeCun's airport plan story as a graph walking problem
- Rich Sutton calls hierarchy "subproblems" in his talk https://youtu.be/gEbbGyNkR2U?t=2289
- Covert action
	- Work on graphs in memory
	- Reuse parts of graph
	- Action as a sequence of "senses" entirely in latent space
- Prediction space selection
	- How does this relate to the topology vs. geometry point in 
	- Don't predict every pixel, just what's relevant 
	- Select form multiple spaces (search) - e.g:
		- Saltiness and  acidity, vs saltiness and sourness.
		- Position and velocity vs. position and mass
		- Learn any prediction space coordinates (prediction space IDs in the form of a list of numbers)
	- The higher the abstraction, the more it's worth to spend your time choosing a prediction space
- Arbitrary time (forward) axis selection
	- Straightening curled piece string on axis analogy
	- Road is windy, yet it's easy to imagine stopping at a gas station halfway through
- High level game design search from Jonas Tyroller https://youtu.be/o5K0uqhxgsE
- 





## 5. Outro
In conclusion
	- When it comes to figuring out the hidden causes of our observations.
	- "Why did you move to Scotland?"
	- "For the weather."
	- Thank you.




## Notes

**Friston MoroccoAI talk**
https://youtu.be/o83YKTD6bno
- Epistemic foraging
- Expected information gain - mouse can get a cue on where the cheese is, trick mouse keep cheese at same place, mouse stops visiting cue after it learns cheese stays in place
- wtf is a factor graph
- Markov decision process (POMDP)
- Helmholtz - The Facts of Perception (1878).

> Each movement we make by which we alter the appearance of objects should be thought of as an experiment designed to test whether we have understood correctly the invariant relations of the phenomena before us, that is, their existence in definite spatial relations. 
> 
>Helmholtz

**Markov blankets**
https://youtu.be/cKZIJQLhudk
- Good for understanding open systems
- Understanding how a system is in a particular state
- Not just for the brain
- Can be used to predict future states
- Good for "scale free"

### # Relaxing our beliefs: Free energy principle, Canalization and Predictive Processing: Karl Friston
https://youtu.be/qPl-2zhMBY0?t=4349
- Precision
- Minimization of precision weighted prediction errors
- Not just gradient of prediction errors
- If we're in a noisy environment, we can down-weight the prediction errors to ignore them
- If I know we're in an environment with a high signal to noise ratio, we can be more confident (assign higher precision) to those prediction errors
- Seems relevant to learning
- This has all the hallmarks of "attention"
- From a physics point of view, precision manifests as depth of "belief canals"
	- If I'm in a precise state of mind, I'm not going to deviate from the valley I'm in (sharp valley, landscape is deeply carved)
	- Low precision is shallow carved landscape (we have latitude to wander around without incurring a cost)
	- Flattening of the landscape enables you to explore different options
## References
[Thomas Parr: The neurobiology of active inference ](https://youtu.be/iPMGLWM5le0)
[MoroccoAI Conference 2024 - Keynote - Prof. Karl Friston](https://youtu.be/o83YKTD6bno) 
https://www.learnactiveinference.org/
Yann LeCun "Mathematical Obstacles on the Way to Human-Level AI" https://youtu.be/ETZfkkv6V7Y

“How Could Machines Reach Human-Level Intelligence?” by Yann LeCun https://youtu.be/xL6Y0dpXEwc

[Rich Sutton, The OaK Architecture](https://youtu.be/gEbbGyNkR2U) 