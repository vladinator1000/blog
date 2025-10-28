---
external: false
draft: true
title: "Parsing and rendering TSX incrementally (coming soon)"
description: "Editing TSX visually and textually and rendering it efficiently. (Shader editor for designers - part 3)"
date: 2025-11-01
---

## The intersection of design and parallel computing
<!-- To explore:
- Applying compute shaders to more primitives like points
- Using the points to create other visuals a-la Unreal PCG [https://nebukam.github.io/PCGExtendedToolkit/](https://nebukam.github.io/PCGExtendedToolkit/), [Houdini operators](https://caveacademy.com/wiki/software/introduction-to-houdini-course/04-networks-and-operators-ops/)
- What if you could simulate and nudge points physically (blending simulation and user input)
- Multiplayer
- Asset management, treat pages and components as modules that can be imported
- Language model integration
- Shader browser and community -->

In the end, there's one question at the centre of this experiment:
> What if compute shaders were as easy to write, compose and share as React components?

Answering that question fully will require more than one article, and it will involve:
- Incremental and error-tolerant parsing of TypeScript code
- Transactions and conflict-free replicated data types
- Efficient re-rendering elements when the code changes 
- Bi-directional editing - from code to GUI and back
- Stable user selections that survive refactors and formatting

A sneak peek:

{% video src="/images/design-gpu/tree-explorer.mp4" alt="" /%}






