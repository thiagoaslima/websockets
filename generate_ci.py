#!/usr/bin/env python3
import argparse
import os
import json
import requests
from jinja2 import Environment, FileSystemLoader

parser = argparse.ArgumentParser()
parser.add_argument(
    "--gen-chart-values",
    dest="gen_chart_values",
    action="store_true",
    help="Generates helm values for every client into .gitlab/ dir",
)
args = parser.parse_args()

client_name_whitelist = {
    "dev",
    "prod",
    "flywheel_aws_dev",
    "prod-eu",
    "staging",
}

headers = {"PRIVATE-TOKEN": os.environ.get("GITLAB_TOKEN")}
r = requests.get(
    "https://gitlab.com/api/v4/projects/31330206/repository/files/clients.json/raw?ref=main",
    headers=headers,
)
clients = json.loads(r.content)
clients = [client for client in clients if client.get("name") in client_name_whitelist]
file_loader = FileSystemLoader("templates")
env = Environment(loader=file_loader)

if args.gen_chart_values:
    values_template = env.get_template("generate-values.jinja")

    for client in clients:
        output = values_template.render(client=client)

        path = f"./.gitlab/values-{client['name']}.yaml"
        with open(path, "w") as file:
            file.write(output)

else:
    template = env.get_template("generate-ci.jinja")

    output = template.render(clients=clients)
    print(output)
