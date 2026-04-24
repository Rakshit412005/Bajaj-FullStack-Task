const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const isValid = (s) => {
    if (!s) return false;
    s = s.trim();
    if (!/^[A-Z]->[A-Z]$/.test(s)) return false;
    const [a, b] = s.split("->");
    if (a === b) return false;
    return true;
};

app.post("/bfhl", (req, res) => {

    const input = req.body.data || [];

    let invalid_entries = [];

    let duplicate_edges = [];

    let seen = new Set();
    let edges = [];

    for (let e of input) {
        
        if (!isValid(e)) {
            invalid_entries.push(e);
            continue;
        }

        if (seen.has(e)) {
            if (!duplicate_edges.includes(e)) {
                duplicate_edges.push(e);
            }
            continue;
        }

        seen.add(e);
        edges.push(e);
    }

    let children = {};
    let parent = {};


    for (let e of edges) {
        let [p, c] = e.split("->");

        if (!children[p]) children[p] = [];

        if (!parent[c]) {
            parent[c] = p;
            children[p].push(c);
        }
    }

   
    let nodes = new Set();
    edges.forEach(e => {
        let [p, c] = e.split("->");
        nodes.add(p);
        nodes.add(c);
    });

   
    let roots = [];
    nodes.forEach(n => {
        if (!parent[n]) roots.push(n);
    });

    let visited = new Set();
    let hierarchies = [];


    const dfs = (node, path) => {
        if (path.has(node)) return null; 

        path.add(node);
        visited.add(node);

        let subtree = {};
        let maxDepth = 1;

        if (children[node]) {
            for (let child of children[node]) {
                let res = dfs(child, new Set(path));
                if (!res) return null;

                subtree[child] = res.tree;
                maxDepth = Math.max(maxDepth, 1 + res.depth);
            }
        }

        return { tree: subtree, depth: maxDepth };
    };

    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let largest_depth = 0;

    const processTree = (root) => {
        let result = dfs(root, new Set());

        if (!result) {
            return null; 
        }

        total_trees++;

        if (
            result.depth > largest_depth ||
            (result.depth === largest_depth && root < largest_tree_root)
        ) {
            largest_depth = result.depth;
            largest_tree_root = root;
        }

        return {
            root,
            tree: { [root]: result.tree },
            depth: result.depth
        };
    };

    
    for (let r of roots) {
        if (!visited.has(r)) {
            let tree = processTree(r);
            if (tree) hierarchies.push(tree);
        }
    }

    
    const exploreComponent = (start) => {
        let stack = [start];
        let comp = [];

        while (stack.length) {
            let node = stack.pop();

            if (visited.has(node)) continue;

            visited.add(node);
            comp.push(node);

            if (children[node]) {
                for (let c of children[node]) stack.push(c);
            }

            if (parent[node]) {
                stack.push(parent[node]);
            }
        }

        return comp;
    };

    nodes.forEach(node => {
        if (!visited.has(node)) {
            let comp = exploreComponent(node);

            let root = comp.sort()[0]; 

            total_cycles++;

            hierarchies.push({
                root,

                tree: {},

                has_cycle: true
            });
        }
    });

    res.json({
        user_id: "rakshitkumar_04012005",
        email_id: "rk1056@srmist.edu.in",
        college_roll_number: "RA2311003010755",
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
            total_trees,
            total_cycles,
            largest_tree_root
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));