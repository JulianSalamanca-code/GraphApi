from ghcr.io/wundergraph/cosmo-router:latest

COPY cosmo.config.yaml /etc/cosmo/router/config.yaml
COPY subgraphs.yaml /etc/cosmo/router/subgraphs.yaml
COPY subgraphs/ /etc/cosmo/router/subgraphs/
COPY execution-config.json /etc/cosmo/router/execution-config.json

EXPOSE 3000

ENTRYPOINT ["/dist/router"]
CMD ["--config", "/etc/cosmo/router/config.yaml"]
