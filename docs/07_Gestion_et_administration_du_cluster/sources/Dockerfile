# Use the UBI8 base image
FROM registry.access.redhat.com/ubi8/ubi

# Install necessary tools for network traffic manipulation
RUN yum install -y iproute tc iputils && \
    yum clean all

# Set up a default command to keep the container running
CMD ["/bin/bash"]
