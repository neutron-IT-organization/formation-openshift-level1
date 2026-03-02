# Use the Red Hat Universal Base Image (UBI) as the base image
FROM registry.access.redhat.com/ubi8/go-toolset

# Copy the local package files to the container's workspace
COPY . .

# Build the Go application
RUN go build -o main main.go

# Expose the port the application runs on
EXPOSE 8080

# Run the Go application and then sleep indefinitely
CMD ["sh", "-c", "./main && while true; do sleep 10; done"]
