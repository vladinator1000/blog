---
external: false
title: "Slop machines"
description: ""
date: 2026-03-17
---

Coding agents are useful, but something feels off.

> It’s a strange time to be a programmer. It’s easier than ever to get started, but also easier than ever to let AI steer you into a situation where you’re overwhelmed by code you don’t understand.
> 
> Johno Whitaker, fast.ai

I spent half a year using coding agents, going through incredible highs and incredible lows. Prompting to fix a bug introduced other subtle bugs. Everyone's either building with agents or building agents... And I'm sitting here feeling like "this can't be worth it in the long run".

Setting up customers to spend their limited cognitive energy to avoid brain rot at every turn is, at best, a product mistake, and at worst, a deliberate attempt to turn users into cattle.

I'm not the only one feeling this, here's Fred Durst on the matter: 

![fred-durst](/images/slop-machines/fred-durst.png)

We need ways of using language models that don't make us dumber in the long run.

There are a couple of problems at the root of the cognitive decline we're experiencing:
1. Correcting a model after it makes a mistake increases the likelihood of future mistakes.
2. Personifying models discourages understanding.

## Increasing the likelihood of future mistakes

Correcting a LM after it generates wrong output in a conventional chat interface makes it more likely for the model to generate wrong output.

This is due to the fundamental way the technology works (auto-regression). It predicts the next token in a sequence, and the more bad examples the context has, the higher the chance of more bad ones appearing.

## Personifying models discourages understanding

Personification of tools leads us to think we can hand off work without consequences. It's hard to pull this off with people, let alone language models. Think about the amount of trust you need to build with someone before you can rely on them. Even when we trust each other, we still hold each other accountable for mistakes. A computer can't be held accountable, if it makes a mistake, someone else has to cover the costs.

> Do not fall into the trap of anthropomorphising Larry Ellison. You need to think of Larry Ellison the way you think of a lawnmower. You don't anthropomorphize your lawnmower, the lawnmower just mows the lawn, you stick your hand in there and it'll chop it off, the end. You don't think "the lawnmower hates me", the lawnmower doesn't give a shit about you, lawnmower can't hate you. (Bryan Cantrill, [https://youtu.be/-zRN7XLCRhc](https://youtu.be/-zRN7XLCRhc))

Using language models as agents magnifies their drawbacks.

Delegating actions to something else makes it easy to relinquish understanding and lose track of the causality of changes. I've seen many teams try to solve this by making "productivity systems" that try to reduce the amount of mistakes LMs make. From querying databases, to procedural checklists, planning loops, heaps of markdown files, you name it. 

Trying to reduce the likelihood of LMs making mistakes like that is a band aid trying to compensate for the inherent limitations of auto-regressive generation of text.

Relinquishing understanding leads to accumulation of cognitive debt. When things eventually break, we need to pay off the accumulated interest before we even reach the principal.

Don't anthropomorphize the lawnmower!

## Cognitive debt

As agents write for us, there's more and more to understand until it all starts feeling like "a lot". I believe this tendency comes from how funny we (as people) feel about big numbers. It's easy to relate to one or two things, but as the number increases we just give up and treat large numbers as "a lot".

If your personality is anything like mine, having a big pile of stuff to go through makes it hard to even start. A hard personality counter, if you will, but we also need to cover the long term effects:

> Over four months, LLM users consistently underperformed at neural, linguistic, and behavioural levels. (Kosmyna, et al., [Your Brain on ChatGPT](https://www.media.mit.edu/publications/your-brain-on-chatgpt/)) 

Language models are undoubtfully useful, but they have become synonymous with artificial intelligence, while being only a subset of it.

As humans, we are constantly engaged in the process of gathering evidence for our existence. The less often we see this evidence, the less often we learn. 

This idea is based on [Active Inference](https://direct.mit.edu/books/oa-monograph/5299/Active-InferenceThe-Free-Energy-Principle-in-Mind) - a way of understanding sentient behavior. It looks at perception, planning and action from the perspective of probabilistic inference. Based on an optimization theory called the Free Energy Principle, which is about making a prediction, sampling the world, measuring your "surprise" and minimizing it over time.

I believe us maintaining ownership over this sampling (acting) is crucial if we are to learn. Here's the real question we should be asking ourselves:

*How much understanding am I willing to trade for a short-term productivity burst?*

When trading understanding, we're trading away mastery, which requires deliberate practice to achieve. Language models are statistical machines that interpolate between their training dataset. As soon as you step out of the training set, they start to feel much less intelligent.

If we trade mastery for interpolation, are we okay with becoming mediocre?


## Focus

From a friend who is deep into the "agentic" workflow:

> The stress I feel from context switching now is insane. I don't deep dive a task for 4 hours, I set up two agents to fight each other then go do something else all within 5-10 mins. Swapping project, language, context every 5-10 mins is killing my brain and I don't know why. (My friend Thorfinn)

In order to be able to focus, we need to discover meditation from first principles:
1. Take boring breaks.
2. Inhabit the time in-between.
3. Do one thing at a time.

We could try dealing with this by shifting to the [manager's schedule](https://www.paulgraham.com/makersschedule.html), but there's a problem.
Makers don't want to be managers!

It's one thing to context switch every hour. But if we do it every 15 minutes, we're purposefully shooting ourselves in the foot. Don't you want to feel powerful, don't you want to be a manager? Now you can! You just don't get to do it with actual people, you get to cosplay as a manager while another person is telling *you* what to do. 

I also wonder why so many entry-level roles get cut in response to LM progress. I bet that will lead to a shortage of skilled software engineers in the future.
1. If they're doing something a language model can handle without a problem, they're not working on hard enough problems and are at risk of being outcompeted by someone who is.
2. It signals a disregard for building institutional knowledge, which is a fundamental economic moat in the technology sphere.
3. Signals a lack of faith in the broader economy long-term.

> It's funny how often proponents of AI say "I started to enjoy programming for the first time in years" and yet they're surprised when people who *currently* enjoy programming aren't as enthusiastic about the change. (My pal Joe)

Ideas are back in style. We could use some more time [writing them down](https://rfd.shared.oxide.computer/rfd/0001) and iterating on them. It's easier than ever to spend capital on boneheaded ideas. All it takes is to psych yourself out with an LLM. At least before there was more friction (like getting high in the desert with your co-founder, or listening to an a16z podcast for an hour) before you burn a million on something nobody asked for. 

There is only one type of meeting we need more of, and that's meeting with customers.

## Agents are slot machines

I spent years of my career developing video games and working for a gambling company.
I see striking similarities between coding agents and gambling devices. 

Starting with the obvious ones:
- Doesn't require prior knowledge.
- Anyone can start playing with a small fee.
- Anticipatory dopamine release while results are streaming in.

Honorable mentions:
- Near misses, almost winning, illusion of progress from plausible-looking tests.
- Illusion of control - prompt engineering, just one more markdown file, model weights matter more than context but stay fixed.
- Losses disguised as wins - writing lots of code in a short time.
- Making up your losses with another spin, sunk cost fallacy, walking away from accumulated investment.
- Hoping for a jackpot - seeing outliers making money from unfinished demos, keep you playing when the median result is mediocre.

Bonus: Executive tourists mandating usage. This is the part that led me to the "turning developers into cattle" remark in the intro. I thought that a problem in search of solution was better than solution in search of problem? Whatever happened to that age-old wisdom?

And then there is the one that is capable of re-wiring our brain... The one to rule them all.
### Operant conditioning with a partial reinforcement schedule

A revolutionary psychology book was published in 1957 - Schedules of Reinforcement by Fester and Skinner. They created a box with a button on the interior wall, put a pigeon in it. When the pigeon pecked the button, the machine would dispense food. The button was connected to a counter.

They showed that:
1. You can condition the pigeon to change its behavior.
2. Operant conditioning works on humans.
3. Rewarding a human after they perform a desired action a *random number of times* is a very effective way of getting them to repeat the action.

This is a Skinner Box. Skinner talked about this in the context of gambling. Gamblers are well aware of it, and yet they keep gambling. What's more fun, spending 8 hours in a casino, or pushing a buttons at a factory for a salary?

Skinner also showed that
1. Primary conditioners (like food, water, sex) have a reduced effect once a person is satiated.
2. Secondary conditioners (like money or social praise) don't have a satiation point.

> The problem is that (using Skinner Boxes) is a lazy and cheap way of making people believe they're enjoying your product. (Extra Credits, [https://youtu.be/tWtvrPTbQ_c](https://youtu.be/tWtvrPTbQ_c))

This quote is from 14 years ago! Skinner boxes are endemic, we just can't get away from them. Just look around and you'll start seeing them everywhere... 

I see them in all popular language model coding tools. Every time the code they generate seems to work, it reinforces us to keep prompting. But it doesn't work all the time - this makes us unable to stop prompting.

The illusion of progress we get when we see the tests pass and the happy path working... The feeling of almost winning, there's a strategic uncertainty to it that renders us unable to draw conclusions that can be used to stop the behavior. 

Imagine you're in front of a vending machine. You put a quarter in, nothing drops, then put another quarter in and it gives you nothing a second time. Would you put a 3rd quarter in?

The one part where language models and slot machines differ. You're mathematically guaranteed to lose in slots. Language models won't inherently make you lose, but the actor model-based user interface will. We are playing the wrong game.

![zozin](/images/slop-machines/zozin.png)


## Hopeful for alternatives

I won't pretend I have a definitive answer for you here, because if I did, I'd be building a company around it... But I do believe that people like Johno [Whitaker and Jeremy Howard](https://www.answer.ai/posts/2025-10-01-solveit-full.html) are onto something:

![solve-it](/images/slop-machines/solve-it.png)

Instead of prompt engineering, they're working on something called *dialogue engineering*. You have a tree with editable branches, and you're constantly in the process of pruning the tree at various points to keep the context clear of bad examples.

It also flips the agency to the user, making the LM an advisor by default. You run small snippets of code and it immediately shows you the result inline, in a Python notebook-like REPL environment. You writing the code slows you down to afford paying attention to the output and playing with the code to learn how it works in small steps. 

Another quote by Joe:
![joe-learning](/images/slop-machines/joe-learning.png)

Doing things  sequentially, in small steps, and without distractions seems crucial to learning.

You can create and edit branches manually or re-prompt a branch as you groom the tree, as well as pin/unpin branches from context if you want to generate a new branch using a subset of the tree.

I'm not using Johno and Jeremy's tool, because it costs $500 just to sign up (holy pricing), it's very opinionated and doesn't run on your computer. I'm not super convinced about the Python (eugh...) notebook running on a server part, but the tree user interface combined with personal agency feels like it supports the long term understanding idea. And they're not the only ones thinking about this:

![david-k](/images/slop-machines/david-k.png)


Language models are useful. No doubt about it, but if I hear the word "agentic" one more time, I swear...

> How can a system possibly plan a sequence of actions if it can't predict the consequences of its actions? (Yann LeCun)


Thank you for reading.

Don't anthropomorphize the lawnmower.