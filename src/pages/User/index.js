import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator } from 'react-native';

import api from '../../services/api';

import {
  Container,
  Header,
  Avatar,
  Name,
  Bio,
  Stars,
  Starred,
  OwnerAvatar,
  Info,
  Title,
  Author,
} from './styles';

export default class User extends Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam('user').name,
  });

  static propTypes = {
    navigation: PropTypes.shape({
      getParam: PropTypes.func,
      navigate: PropTypes.func,
    }).isRequired,
  };

  state = {
    stars: [],
    loading: true,
    page: 1,
    loadingPage: false,
    refreshing: false,
  };

  async componentDidMount() {
    this.loadStarred();
  }

  loadStarred = async (page = 1) => {
    const { navigation } = this.props;
    const user = navigation.getParam('user');

    const { stars } = this.state;

    const response = await api.get(`/users/${user.login}/starred`, {
      params: { page },
    });

    this.setState({
      stars: page > 1 ? [...stars, ...response.data] : response.data,
      page,
      loadingPage: false,
      loading: false,
      refreshing: false,
    });
  };

  loadMoreStarred = () => {
    const { stars, page } = this.state;
    const nextPage = page + 1;

    if (stars.length >= 30) {
      this.setState({ loadingPage: true });

      this.loadStarred(nextPage);
    }
  };

  refreshList = async () => {
    this.setState(
      {
        stars: [],
        refreshing: true,
      },
      this.loadStarred
    );
  };

  renderFooter = () => {
    const { loadingPage } = this.state;
    if (!loadingPage) return null;

    return <ActivityIndicator animating size="small" color="#7159c1" />;
  };

  handleNavigate = repository => {
    const { navigation } = this.props;

    navigation.navigate('Repository', { repository });
  };

  render() {
    const { navigation } = this.props;
    const { stars, loading, refreshing, loadingPage } = this.state;

    const user = navigation.getParam('user');

    return (
      <Container>
        <Header>
          <Avatar source={{ uri: user.avatar }} />
          <Name>{user.name}</Name>
          <Bio>{user.bio}</Bio>
        </Header>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#7159c1"
            style={{ flex: 1, justifyContent: 'center' }}
          />
        ) : (
          <Stars
            data={stars}
            keyExtractor={star => String(star.id)}
            renderItem={({ item }) => (
              <Starred onPress={() => this.handleNavigate(item)}>
                <OwnerAvatar source={{ uri: item.owner.avatar_url }} />
                <Info>
                  <Title>{item.name}</Title>
                  <Author>{item.owner.login}</Author>
                </Info>
              </Starred>
            )}
            onEndReachedThreshold={0.2}
            onEndReached={() => {
              if (!loadingPage) this.loadMoreStarred();
            }}
            initialNumToRender={30}
            onRefresh={this.refreshList}
            refreshing={refreshing}
            ListFooterComponent={this.renderFooter}
          />
        )}
      </Container>
    );
  }
}
