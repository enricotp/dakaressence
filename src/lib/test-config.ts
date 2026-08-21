import { getHomeConfig } from "./home-config.functions";

async function test() {
  const config = await getHomeConfig();
  console.log(JSON.stringify(config, null, 2));
}

test();
