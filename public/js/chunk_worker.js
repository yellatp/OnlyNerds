self.onmessage = async ({ data: url }) => {
    try {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to fetch ${url}`);
        self.postMessage(await res.json());
    } catch (err) {
        self.reportError(err);
    }
};
