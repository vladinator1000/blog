import type { z } from "zod"
import matter from "gray-matter"
import Markdoc from "@markdoc/markdoc"
import { config } from "./markdoc.config"

// Vite resolves these at build time, inlining file contents into the bundle.
// This avoids fs access during Cloudflare's miniflare prerendering.
const contentModules = import.meta.glob("../../../content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>

function parseAndTransform({ content }: { content: string }) {
  const ast = Markdoc.parse(content)

  const errors = Markdoc.validate(ast, config)
  if (errors.length) {
    console.error(errors)
    throw new Error("Markdoc validation error")
  }
  const transformedContent = Markdoc.transform(ast, config)

  return transformedContent
}

function validateFrontmatter<T extends z.ZodTypeAny>({
  frontmatter,
  schema,
  filepath,
}: {
  frontmatter: { [key: string]: unknown }
  schema: T
  filepath: string
}) {
  try {
    const validatedFrontmatter = schema.parse(frontmatter)
    return validatedFrontmatter as z.infer<T>
  } catch (e) {
    const errMessage = `
      There was an error validating your frontmatter. 
      Please make sure your frontmatter for file: ${filepath} matches its schema.
    `
    throw Error(errMessage + (e as Error).message)
  }
}

function readFromRaw<T extends z.ZodTypeAny>({
  rawString,
  schema,
  filepath,
}: {
  rawString: string
  schema: T
  filepath: string
}) {
  const { content, data: frontmatter } = matter(rawString)
  const transformedContent = parseAndTransform({ content })
  const validatedFrontmatter = validateFrontmatter({
    frontmatter,
    schema,
    filepath,
  })

  const filename = filepath.split("/").pop()
  if (typeof filename !== "string") {
    throw new Error("Check what went wrong")
  }
  const fileNameWithoutExtension = filename.replace(/\.[^.]*$/, "")

  return {
    slug: fileNameWithoutExtension,
    content: transformedContent,
    frontmatter: validatedFrontmatter,
  }
}

export async function readOne<T extends z.ZodTypeAny>({
  directory,
  slug,
  frontmatterSchema: schema,
}: {
  directory: string
  slug: string
  frontmatterSchema: T
}) {
  const globKey = Object.keys(contentModules).find((key) =>
    key.endsWith(`/content/${directory}/${slug}.md`)
  )
  if (!globKey || !contentModules[globKey]) {
    throw new Error(`File not found: content/${directory}/${slug}.md`)
  }
  return readFromRaw({
    rawString: contentModules[globKey],
    schema,
    filepath: globKey,
  })
}

export async function readAll<T extends z.ZodTypeAny>({
  directory,
  frontmatterSchema: schema,
}: {
  directory: string
  frontmatterSchema: T
}) {
  const entries = Object.entries(contentModules).filter(([key]) =>
    key.includes(`/content/${directory}/`) && key.endsWith(".md")
  )

  return entries.map(([key, rawString]) =>
    readFromRaw({ rawString, schema, filepath: key })
  )
}
