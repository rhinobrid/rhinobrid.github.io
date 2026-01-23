/**
 * Tweet-specific utilities
 *
 * Provides helper functions for managing tweet collections:
 * - Filtering with draft support
 * - Sorting by date
 * - Grouping by year
 * - Tag analysis
 */

import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

/**
 * Get all tweets from collection with draft filtering
 *
 * Filters out draft posts in production environment.
 *
 * @returns Promise<CollectionEntry<'microposts'>[]> Array of non-draft tweets
 */
export async function getTweetsCollection(): Promise<CollectionEntry<'microposts'>[]> {
  return await getCollection('microposts', ({ data }: CollectionEntry<'microposts'>) => {
    // Filter out drafts in production
    return import.meta.env.PROD ? !data.draft : true
  })
}

/**
 * Sort tweets by publish date (newest first)
 *
 * @param tweets - Array of tweet collection entries
 * @returns Sorted array with newest tweets first
 */
export function sortTweetsByDate(
  tweets: CollectionEntry<'microposts'>[]
): CollectionEntry<'microposts'>[] {
  return [...tweets].sort((a, b) => {
    const aDate = new Date(a.data.publishDate ?? 0).valueOf()
    const bDate = new Date(b.data.publishDate ?? 0).valueOf()
    return bDate - aDate
  })
}

/**
 * Group tweets by year
 *
 * Organizes tweets into year-based groups, sorted by year descending.
 *
 * @param tweets - Array of tweet collection entries
 * @returns Array of [year, tweets[]] pairs, sorted by year descending
 *
 * @example
 * const grouped = groupTweetsByYear(tweets)
 * // Returns: [[2025, [tweet1, tweet2]], [2024, [tweet3]]]
 */
export function groupTweetsByYear(
  tweets: CollectionEntry<'microposts'>[]
): [number, CollectionEntry<'microposts'>[]][] {
  const grouped = tweets.reduce((acc, tweet) => {
    const year = new Date(tweet.data.publishDate).getFullYear()
    if (!acc.has(year)) {
      acc.set(year, [])
    }
    acc.get(year)!.push(tweet)
    return acc
  }, new Map<number, CollectionEntry<'tweets'>[]>())

  return Array.from(grouped.entries()).sort((a, b) => b[0] - a[0])
}

/**
 * Get unique tags from all tweets with counts
 *
 * @param tweets - Array of tweet collection entries
 * @returns Array of [tag, count] pairs, sorted by count descending
 *
 * @example
 * const tags = getUniqueTagsWithCount(tweets)
 * // Returns: [['webdev', 5], ['typescript', 3], ['astro', 1]]
 */
export function getUniqueTagsWithCount(
  tweets: CollectionEntry<'microposts'>[]
): [string, number][] {
  const tagCounts = tweets
    .flatMap((tweet) => tweet.data.tags)
    .reduce((acc, tag) => acc.set(tag, (acc.get(tag) || 0) + 1), new Map<string, number>())

  return Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])
}

/**
 * Get unique tags from all tweets (without counts)
 *
 * @param tweets - Array of tweet collection entries
 * @returns Array of unique tag strings
 *
 * @example
 * const tags = getUniqueTags(tweets)
 * // Returns: ['webdev', 'typescript', 'astro']
 */
export function getUniqueTags(tweets: CollectionEntry<'microposts'>[]): string[] {
  return [...new Set(tweets.flatMap((tweet) => tweet.data.tags))]
}
