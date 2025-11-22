# Service Logs Directory

This directory contains log files for all GrowthMonitor services.

## Log Files

- `frontend.log` - React frontend (Vite dev server)
- `api_server.log` - Express API server
- `ai_worker.log` - Python FastAPI AI worker

## View Logs

```bash
# View specific service log
tail -f logs/frontend.log
tail -f logs/api_server.log
tail -f logs/ai_worker.log

# View all logs simultaneously
tail -f logs/*.log
```

## PID Files

- `frontend.pid` - Process ID of frontend service
- `api_server.pid` - Process ID of API server
- `ai_worker.pid` - Process ID of AI worker

These files are used by `stop.sh` to gracefully shutdown services.

## Cleanup

Logs are automatically created when services start. To clear old logs:

```bash
rm -f logs/*.log
```

Note: PID files are automatically cleaned up by `stop.sh`.
