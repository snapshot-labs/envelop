> 🚧 Ths file is extracted from https://github.com/snapshot-labs/guidebook/wiki/Codestyle. See original link for most up-to-date content.

## Commits

- Use prefix like feat:, fix:, refactor: for commits, see complete list of prefix here: [https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)

## Codestyle

- Remove console.log.
- Avoid code duplicate.
- Use "Sentence case" for texts and titles on UI, not "Title Case".
- Use official casing for trademarks, do: WalletConnect, GitHub, don't do: Wallet Connect, Github.
- Simpler is better, avoid adding extra complexity.
- The less code you use the better is it.
- Add types in your code.

## Create a pull request

**Here is few rules you should apply when creating a pull request**

- Explain what your pull request is doing in the description, if there is UI changes add screenshot(s) or Loom record.
- Explain how to test the changes.
- Use prefix like feat:, fix:, refactor: in the title of your pull request and commits, see complete list of prefix here: [https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)
- Link your pull request to an issue, a pull request should solve only 1 issue, if you want solve 2 issues you should do 2 separate pull requests.
- Breakdown large pull request to smaller ones.

**Good to have**

- If you introduce a new function, add test for it.
- If you introduce new feature or change, update the documentation

## Review a pull request

**Here is few rules you should apply when reviewing a pull request**

- If you approve a pull request use these following abbreviations to better define your level of approval.
  - **cACK** (Concept ACK) Agree with the concept, but haven’t reviewed the changes.
  - **utACK** (UnTested ACKnowledgment) Reviewed and agree with the code changes but haven't actually tested them.
  - **tACK** (Tested ACKnowledgment) Reviewed the code changes and have verified the functionality or bug fix.
- Provide constructive feedback.
- Be precise about what needs to be improved.
- Always try to test changes, use utACK in last resort.

**Good to have**

- Propose ways to make the code simpler.
- Propose ways to make code smaller.

Learn more here [https://www.freecodecamp.org/news/what-do-cryptic-github-comments-mean-9c1912bcc0a4/](https://www.freecodecamp.org/news/what-do-cryptic-github-comments-mean-9c1912bcc0a4/)

## Merge a pull request

- When a change go live make sure to be available in next few hours and monitor our support channel in case an issue is found.
- Delete the branch.
- Update and merge changes to our documentation if something changed.
