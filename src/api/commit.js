// @ts-check
import '../commands/typedefs.js'

import { commit as _commit } from '../commands/commit.js'
import { FileSystem } from '../models/FileSystem.js'
import { E, GitError } from '../models/GitError.js'
import { assertParameter } from '../utils/assertParameter.js'
import { join } from '../utils/join.js'
import { normalizeAuthorObject } from '../utils/normalizeAuthorObject.js'
import { normalizeCommitterObject } from '../utils/normalizeCommitterObject.js'

/**
 * Create a new commit
 *
 * @param {Object} args
 * @param {FsClient} args.fs - a file system implementation
 * @param {SignCallback} [args.onSign] - a PGP signing implementation
 * @param {string} [args.dir] - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.message - The commit message to use.
 * @param {Object} [args.author] - The details about the author.
 * @param {string} [args.author.name] - Default is `user.name` config.
 * @param {string} [args.author.email] - Default is `user.email` config.
 * @param {Date} [args.author.date] - Set the author timestamp field. Default is the current date.
 * @param {number} [args.author.timestamp] - Set the author timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.author.timezoneOffset] - Set the author timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {Object} [args.committer = author] - The details about the commit committer, in the same format as the author parameter. If not specified, the author details are used.
 * @param {string} [args.committer.name] - Default is `user.name` config.
 * @param {string} [args.committer.email] - Default is `user.email` config.
 * @param {Date} [args.committer.date] - Set the committer timestamp field. Default is the current date.
 * @param {number} [args.committer.timestamp] - Set the committer timestamp field. This is an alternative to using `date` using an integer number of seconds since the Unix epoch instead of a JavaScript date object.
 * @param {number} [args.committer.timezoneOffset] - Set the committer timezone offset field. This is the difference, in minutes, from the current timezone to UTC. Default is `(new Date()).getTimezoneOffset()`.
 * @param {string} [args.signingKey] - Sign the tag object using this private PGP key.
 * @param {boolean} [args.dryRun = false] - If true, simulates making a commit so you can test whether it would succeed. Implies `noUpdateBranch`.
 * @param {boolean} [args.noUpdateBranch = false] - If true, does not update the branch pointer after creating the commit.
 * @param {string} [args.ref] - The fully expanded name of the branch to commit to. Default is the current branch pointed to by HEAD. (TODO: fix it so it can expand branch names without throwing if the branch doesn't exist yet.)
 * @param {string[]} [args.parent] - The SHA-1 object ids of the commits to use as parents. If not specified, the commit pointed to by `ref` is used.
 * @param {string} [args.tree] - The SHA-1 object id of the tree to use. If not specified, a new tree object is created from the current git index.
 *
 * @returns {Promise<string>} Resolves successfully with the SHA-1 object id of the newly created commit.
 *
 * @example
 * let sha = await git.commit({
 *   dir: '$input((/))',
 *   author: {
 *     name: '$input((Mr. Test))',
 *     email: '$input((mrtest@example.com))'
 *   },
 *   message: '$input((Added the a.txt file))'
 * })
 * console.log(sha)
 *
 */
export async function commit ({
  fs: _fs,
  onSign,
  dir,
  gitdir = join(dir, '.git'),
  message,
  author: _author,
  committer: _committer,
  signingKey,
  dryRun = false,
  noUpdateBranch = false,
  ref,
  parent,
  tree
}) {
  try {
    assertParameter('fs', _fs)
    assertParameter('message', message)
    if (signingKey) {
      assertParameter('onSign', onSign)
    }
    const fs = new FileSystem(_fs)

    const author = await normalizeAuthorObject({ fs, gitdir, author: _author })
    if (!author) throw new GitError(E.MissingAuthorError)

    const committer = await normalizeCommitterObject({
      fs,
      gitdir,
      author,
      committer: _committer
    })
    if (!committer) throw new GitError(E.MissingCommitterError)

    return await _commit({
      fs,
      onSign,
      gitdir,
      message,
      author,
      committer,
      signingKey,
      dryRun,
      noUpdateBranch,
      ref,
      parent,
      tree
    })
  } catch (err) {
    err.caller = 'git.commit'
    throw err
  }
}