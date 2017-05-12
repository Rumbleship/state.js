/**
 * @module tree
 * 
 * A small library of tree algorithms
 * 
 * @copyright (c) 2017 David Mesquita-Morris
 * 
 * Licensed under the MIT and GPL v3 licences
 */

/**
 * Returns the ancestry of a node within a tree from the root as an array.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node The node to return the ancestry for.
 */
export function ancestors<TNode extends { parent: TNode }>(node: TNode): Array<TNode> {
	const result = node && node.parent ? ancestors(node.parent) : [];

	if (node) {
		result.push(node);
	}

	return result;
}

/**
 * Returns the index of the lowest/least common ancestor given a pair of ancestrys.
 * @param TNode A common type shared by all node instances within the tree.
 * @param ancestry1 The ancestry of a node within the tree.
 * @param ancestry2 The ancestry of a node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
export function lowestCommonAncestorIndex<TNode extends { parent: TNode }>(ancestry1: Array<TNode>, ancestry2: Array<TNode>): number {
	let result = 0;

	if (ancestry1 && ancestry2) {
		while (result < ancestry1.length && result < ancestry2.length && ancestry1[result] === ancestry2[result]) {
			result++;
		}
	}

	return result - 1;
}

/**
 * Returns the lowest/least common ancestor given a pair of nodes.
 * @param TNode A common type shared by all node instances within the tree.
 * @param node1 A node within the tree.
 * @param node2 A node within the tree.
 * @returns The index of the lowest/least common ancestor or -1 if the nodes do not share any ancestry.
 */
export function lowestCommonAncestor<TNode extends { parent: TNode }>(node1: TNode, node2: TNode): TNode | undefined {
	const ancestry1 = ancestors(node1);
	const ancestry2 = ancestors(node2);
	const index = lowestCommonAncestorIndex(ancestry1, ancestry2);

	return index === -1 ? undefined : ancestry1[index];
}

/**
 * Tests a node to see if it is in the ancestry of another node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The possible child node.
 * @param parent The parent node.
 */
export function isChild<TNode extends { parent: TNode }>(child: TNode, parent: TNode): boolean {
	while (child) {
		if (child.parent === parent) {
			return true;
		}

		child = child.parent;
	}

	return false;
}

/**
 * Returns the depth (number of edges from a node to the root) of a node.
 * @param TNode A common type shared by all node instances within the tree.
 * @param child The node to get the depth of.
 * @returns The number of edges between the node an the root node. Returns -1 an undefined node is passed.
 */
export function depth<TNode extends { parent: TNode }>(node: TNode): number {
	let result = -1;

	while (node) {
		result++;

		node = node.parent;
	}

	return result;
}